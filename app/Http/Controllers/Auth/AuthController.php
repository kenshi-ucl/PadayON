<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetOtpMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }

    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            $user = Auth::user();

            if ($user->tenant_id) {
                // For local development, redirect to local dashboard
                if (app()->environment('local')) {
                    return redirect()->intended('/dashboard');
                }

                // In production, redirect to tenant domain
                $tenant = \App\Models\Tenant::find($user->tenant_id);
                if ($tenant && $tenant->domains()->where('is_primary', true)->first()) {
                    $domain = $tenant->domains()->where('is_primary', true)->first()->domain;
                    return redirect()->away('https://' . $domain);
                }
                return redirect('/')->with('error', 'Tenant domain not configured.');
            }

            // Platform admin
            return redirect()->intended('/admin');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    // ─── Forgot Password (OTP Flow) ─────────────────────────────────

    public function showForgotPassword()
    {
        return Inertia::render('Auth/ForgotPassword');
    }

    public function sendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return back()->withErrors([
                'email' => 'We could not find an account with that email address.',
            ]);
        }

        // Delete any previous OTPs for this email
        DB::table('password_reset_otps')->where('email', $request->email)->delete();

        // Generate a 6-digit OTP
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store OTP in database (expires in 10 minutes)
        DB::table('password_reset_otps')->insert([
            'email'      => $request->email,
            'otp'        => Hash::make($otp),
            'verified'   => false,
            'expires_at' => now()->addMinutes(10),
            'created_at' => now(),
        ]);

        // Send OTP via email
        Mail::to($request->email)->send(new PasswordResetOtpMail($otp, $user->name));

        // Store email in session for the next steps
        session(['password_reset_email' => $request->email]);

        return redirect()->route('password.verify-otp')->with('status', 'We have sent a 6-digit OTP to your email address.');
    }

    public function showVerifyOtp()
    {
        $email = session('password_reset_email');

        if (!$email) {
            return redirect()->route('password.request')->withErrors([
                'email' => 'Please enter your email address first.',
            ]);
        }

        return Inertia::render('Auth/VerifyOtp', [
            'email' => $email,
        ]);
    }

    public function verifyOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|string|size:6',
        ]);

        $otpRecord = DB::table('password_reset_otps')
            ->where('email', $request->email)
            ->where('verified', false)
            ->latest('created_at')
            ->first();

        if (!$otpRecord) {
            return back()->withErrors([
                'otp' => 'No OTP found for this email. Please request a new one.',
            ]);
        }

        // Check if expired
        if (now()->greaterThan($otpRecord->expires_at)) {
            DB::table('password_reset_otps')->where('id', $otpRecord->id)->delete();

            return back()->withErrors([
                'otp' => 'This OTP has expired. Please request a new one.',
            ]);
        }

        // Verify the OTP hash
        if (!Hash::check($request->otp, $otpRecord->otp)) {
            return back()->withErrors([
                'otp' => 'The OTP you entered is incorrect. Please try again.',
            ]);
        }

        // Mark OTP as verified
        DB::table('password_reset_otps')->where('id', $otpRecord->id)->update([
            'verified' => true,
        ]);

        // Store verified flag in session
        session(['password_reset_verified' => true]);
        session(['password_reset_email' => $request->email]);

        return redirect()->route('password.reset-form');
    }

    public function showResetPassword()
    {
        $email = session('password_reset_email');
        $verified = session('password_reset_verified', false);

        if (!$email || !$verified) {
            return redirect()->route('password.request')->withErrors([
                'email' => 'Please complete the verification process first.',
            ]);
        }

        return Inertia::render('Auth/ResetPassword', [
            'email' => $email,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => ['required', 'confirmed', \Illuminate\Validation\Rules\Password::min(8)],
        ]);

        $email = session('password_reset_email');
        $verified = session('password_reset_verified', false);

        // Ensure the email matches session and OTP was verified
        if (!$verified || $email !== $request->email) {
            return redirect()->route('password.request')->withErrors([
                'email' => 'Invalid password reset session. Please start over.',
            ]);
        }

        // Double-check that a verified OTP exists in the database
        $otpRecord = DB::table('password_reset_otps')
            ->where('email', $request->email)
            ->where('verified', true)
            ->first();

        if (!$otpRecord) {
            return redirect()->route('password.request')->withErrors([
                'email' => 'Password reset verification not found. Please start over.',
            ]);
        }

        // Update the user's password
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return redirect()->route('password.request')->withErrors([
                'email' => 'User not found.',
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($request->password),
        ])->save();

        // Clean up: delete all OTPs for this email and clear session
        DB::table('password_reset_otps')->where('email', $request->email)->delete();
        session()->forget(['password_reset_email', 'password_reset_verified']);

        return redirect()->route('login')->with('status', 'Your password has been reset successfully. You can now sign in with your new password.');
    }

    public function resendOtp(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return back()->withErrors([
                'email' => 'We could not find an account with that email address.',
            ]);
        }

        // Delete previous OTPs
        DB::table('password_reset_otps')->where('email', $request->email)->delete();

        // Generate new OTP
        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        DB::table('password_reset_otps')->insert([
            'email'      => $request->email,
            'otp'        => Hash::make($otp),
            'verified'   => false,
            'expires_at' => now()->addMinutes(10),
            'created_at' => now(),
        ]);

        Mail::to($request->email)->send(new PasswordResetOtpMail($otp, $user->name));

        return back()->with('status', 'A new OTP has been sent to your email address.');
    }
}
