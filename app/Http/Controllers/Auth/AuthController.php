<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class AuthController extends Controller
{
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

    public function showRegister()
    {
        return Inertia::render('Auth/Register', [
            'plans' => config('padayon.plans'),
        ]);
    }

    public function register(Request $request)
    {
        // Temporary debug logging
        \Illuminate\Support\Facades\Log::info('Registration attempt', [
            'data' => $request->except(['password', 'password_confirmation']),
            'has_password' => $request->filled('password'),
            'has_confirmation' => $request->filled('password_confirmation'),
            'passwords_match' => $request->password === $request->password_confirmation,
        ]);

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users',
                'phone' => 'nullable|string|max:20',
                'password' => ['required', 'confirmed', Password::defaults()],
                'business_name' => 'required|string|max:255',
                'business_type' => 'required|string|max:100',
                'slug' => 'required|string|max:50|unique:tenants,slug|alpha_dash',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Illuminate\Support\Facades\Log::error('Registration validation failed', [
                'errors' => $e->errors(),
                'data' => $request->except(['password', 'password_confirmation']),
            ]);
            throw $e;
        }

        try {
            return \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $request) {
                // Create tenant
                $tenant = Tenant::create([
                    'id' => Str::uuid()->toString(),
                    'name' => $validated['business_name'],
                    'slug' => strtolower($validated['slug']),
                    'business_type' => $validated['business_type'],
                    'business_name' => $validated['business_name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'] ?? null,
                    'plan' => 'free',
                    'trial_ends_at' => now()->addDays(14),
                    'is_active' => true,
                ]);

                // Create domain for the tenant
                $centralDomain = config('tenancy.central_domains.0', 'localhost');
                $tenant->domains()->create([
                    'domain' => strtolower($validated['slug']) . '.' . $centralDomain,
                    'is_primary' => true,
                ]);

                // Create user
                $user = User::create([
                    'tenant_id' => $tenant->id,
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'] ?? null,
                    'password' => Hash::make($validated['password']),
                    'is_owner' => true,
                    'is_active' => true,
                ]);

                // Ensure the owner role exists before assigning
                $ownerRole = \Spatie\Permission\Models\Role::firstOrCreate(
                    ['name' => 'owner', 'guard_name' => 'web']
                );
                $user->assignRole($ownerRole);

                // Seed default product categories based on business type
                $this->seedDefaultCategories($tenant->id, $validated['business_type']);

                Auth::login($user);

                // For local development, redirect to dashboard on the central domain
                if (app()->environment('local')) {
                    return redirect('/dashboard')->with('success', 'Welcome to PadayON! Your 14-day free trial has started.');
                }

                // Redirect to the newly created tenant domain in production
                $domain = $tenant->domains()->where('is_primary', true)->first();
                if ($domain) {
                    return redirect()->away('https://' . $domain->domain);
                }

                return redirect('/')->with('success', 'Welcome to PadayON! Your 14-day free trial has started.');
            });
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Registration failed: ' . $e->getMessage(), [
                'email' => $validated['email'] ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors([
                'email' => 'Registration failed. Please try again. If the problem persists, contact support.',
            ])->withInput($request->except('password', 'password_confirmation'));
        }
    }

    /**
     * Seed default product categories for a new tenant based on their business type.
     */
    private function seedDefaultCategories(string $tenantId, string $businessType): void
    {
        $categoryMap = [
            'retail' => [
                ['name' => 'General Goods',  'slug' => 'general-goods'],
                ['name' => 'Beverages',       'slug' => 'beverages'],
                ['name' => 'Snacks',          'slug' => 'snacks'],
                ['name' => 'Household',       'slug' => 'household'],
            ],
            'food' => [
                ['name' => 'Food Items',  'slug' => 'food-items'],
                ['name' => 'Beverages',   'slug' => 'beverages'],
                ['name' => 'Desserts',    'slug' => 'desserts'],
                ['name' => 'Specials',    'slug' => 'specials'],
            ],
            'services' => [
                ['name' => 'Repair Services',  'slug' => 'repair-services'],
                ['name' => 'Laundry',          'slug' => 'laundry'],
                ['name' => 'Salon & Beauty',   'slug' => 'salon-beauty'],
                ['name' => 'Other Services',   'slug' => 'other-services'],
            ],
            'fashion' => [
                ['name' => 'Tops',        'slug' => 'tops'],
                ['name' => 'Bottoms',     'slug' => 'bottoms'],
                ['name' => 'Footwear',    'slug' => 'footwear'],
                ['name' => 'Accessories', 'slug' => 'accessories'],
            ],
            'health' => [
                ['name' => 'Medicines',      'slug' => 'medicines'],
                ['name' => 'Supplements',    'slug' => 'supplements'],
                ['name' => 'Beauty & Care',  'slug' => 'beauty-care'],
                ['name' => 'Wellness',       'slug' => 'wellness'],
            ],
            'others' => [
                ['name' => 'Products',      'slug' => 'products'],
                ['name' => 'Services',      'slug' => 'services'],
                ['name' => 'Miscellaneous', 'slug' => 'miscellaneous'],
            ],
        ];

        $categories = $categoryMap[$businessType] ?? $categoryMap['others'];

        foreach ($categories as $index => $cat) {
            Category::firstOrCreate(
                [
                    'tenant_id' => $tenantId,
                    'slug'      => $cat['slug'],
                    'type'      => 'product',
                ],
                [
                    'name'       => $cat['name'],
                    'sort_order' => $index,
                    'is_active'  => true,
                ]
            );
        }
    }
}
