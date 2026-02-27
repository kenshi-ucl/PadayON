<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PayMongoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class SettingsController extends Controller
{
    /**
     * Get tenant - falls back to auth user's tenant for local development
     */
    protected function getTenant(): ?Tenant
    {
        $tenant = tenant();

        if (!$tenant && auth()->check()) {
            $tenant = Tenant::find(auth()->user()->tenant_id);
        }

        return $tenant;
    }
    public function index()
    {
        $tenant = $this->getTenant();

        return Inertia::render('Settings/Index', [
            'tenant' => $tenant,
            'regions' => config('padayon.regions'),
        ]);
    }

    public function updateBusiness(Request $request)
    {
        $validated = $request->validate([
            'business_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'business_address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'province' => 'nullable|string|max:100',
            'region' => 'nullable|string|max:50',
            'postal_code' => 'nullable|string|max:10',
            'dti_registration' => 'nullable|string|max:50',
            'bir_tin' => 'nullable|string|max:20',
        ]);

        $tenant = $this->getTenant();
        $tenant->update($validated);

        return back()->with('success', 'Business information updated');
    }

    public function updatePayment(Request $request)
    {
        $validated = $request->validate([
            'gcash_enabled' => 'boolean',
            'maya_enabled' => 'boolean',
            'card_enabled' => 'boolean',
            'cod_enabled' => 'boolean',
            'paymongo_account_id' => 'nullable|string|max:100',
        ]);

        $tenant = $this->getTenant();
        $tenant->update($validated);

        return back()->with('success', 'Payment settings updated');
    }

    public function updateNotifications(Request $request)
    {
        $validated = $request->validate([
            'sms_order_confirmation' => 'boolean',
            'sms_laundry_ready' => 'boolean',
            'sms_credit_reminder' => 'boolean',
            'sms_catering_confirmation' => 'boolean',
            'email_daily_report' => 'boolean',
            'email_low_stock' => 'boolean',
        ]);

        $tenant = $this->getTenant();
        $settings = $tenant->settings ?? [];
        $settings['notifications'] = $validated;
        $tenant->settings = $settings;
        $tenant->save();

        return back()->with('success', 'Notification settings updated');
    }

    public function subscription()
    {
        $tenant = $this->getTenant();
        $subscription = $tenant->activeSubscription;
        $plans = config('padayon.plans');

        return Inertia::render('Settings/Subscription', [
            'tenant' => $tenant,
            'subscription' => $subscription,
            'plans' => $plans,
            'currentPlan' => $plans[$tenant->plan] ?? null,
        ]);
    }

    public function upgrade(Request $request, PayMongoService $payMongoService)
    {
        $validated = $request->validate([
            'plan' => 'required|in:starter,pro,business',
        ]);

        $tenant = $this->getTenant();
        $plan = config("padayon.plans.{$validated['plan']}");

        if (!$plan) {
            return back()->withErrors(['error' => 'Invalid plan selected']);
        }

        // For now, just update the plan (in production, integrate with PayMongo subscription)
        $tenant->plan = $validated['plan'];
        $tenant->subscription_ends_at = now()->addMonth();
        $tenant->save();

        return back()->with('success', "Upgraded to {$plan['name']} plan");
    }

    public function cancel()
    {
        $tenant = $this->getTenant();

        if ($tenant->activeSubscription) {
            $tenant->activeSubscription->cancel();
        }

        $tenant->plan = 'free';
        $tenant->save();

        return back()->with('success', 'Subscription cancelled. You are now on the Free plan.');
    }

    public function team()
    {
        $users = User::where('tenant_id', $this->getTenant()->id)
            ->orderByDesc('is_owner')
            ->orderBy('name')
            ->get();

        return Inertia::render('Settings/Team', [
            'users' => $users,
            'roles' => ['owner', 'manager', 'cashier', 'staff'],
        ]);
    }

    public function inviteTeamMember(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'role' => 'required|in:manager,cashier,staff',
            'password' => 'required|min:8',
        ]);

        $user = User::create([
            'tenant_id' => $this->getTenant()->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'is_owner' => false,
            'is_active' => true,
        ]);

        $user->assignRole($validated['role']);

        return back()->with('success', 'Team member added successfully');
    }

    public function removeTeamMember(User $user)
    {
        if ($user->is_owner) {
            return back()->withErrors(['error' => 'Cannot remove the business owner']);
        }

        if ($user->tenant_id !== $this->getTenant()->id) {
            return back()->withErrors(['error' => 'User not found']);
        }

        $user->delete();

        return back()->with('success', 'Team member removed');
    }
}
