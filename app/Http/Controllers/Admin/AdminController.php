<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AdminController extends Controller
{
    /**
     * Admin dashboard with platform-wide KPIs.
     */
    public function dashboard()
    {
        $this->authorizeAdmin();

        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();

        // KPI cards
        $totalTenants = Tenant::count();
        $activeTenants = Tenant::where('is_active', true)->count();
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $totalOrders = Order::count();
        $totalProducts = Product::count();
        $totalCustomers = Customer::count();

        // Revenue
        $totalRevenue = Order::where('payment_status', 'paid')->sum('total');
        $monthlyRevenue = Order::where('payment_status', 'paid')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('total');
        $todayRevenue = Order::where('payment_status', 'paid')
            ->whereDate('created_at', today())
            ->sum('total');

        // Plan distribution
        $planCounts = Tenant::selectRaw("plan, COUNT(*) as count")
            ->groupBy('plan')
            ->pluck('count', 'plan')
            ->toArray();

        // Users by role
        $adminUsers = User::where('is_admin', true)->count();
        $ownerUsers = User::where('is_owner', true)->count();

        // Order stats
        $unpaidOrders = Order::where('payment_status', 'unpaid')->count();
        $todayOrders = Order::whereDate('created_at', today())->count();
        $monthlyOrders = Order::where('created_at', '>=', $startOfMonth)->count();

        // Revenue chart — last 7 days
        $revenueChart = collect(range(6, 0))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo)->startOfDay();
            return [
                'date' => $date->format('M j'),
                'revenue' => (float) Order::where('payment_status', 'paid')
                    ->whereDate('created_at', $date)
                    ->sum('total'),
                'orders' => Order::whereDate('created_at', $date)->count(),
            ];
        });

        // Recent users (last 10)
        $recentUsers = User::with('tenant')
            ->latest()
            ->take(10)
            ->get(['id', 'name', 'email', 'tenant_id', 'is_admin', 'is_owner', 'is_active', 'created_at']);

        // Recent orders (last 10)
        $recentOrders = Order::with(['tenant', 'customer'])
            ->latest()
            ->take(10)
            ->get();

        // Recent tenants (last 5)
        $recentTenants = Tenant::withCount(['users', 'orders', 'products'])
            ->latest()
            ->take(5)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalTenants' => $totalTenants,
                'activeTenants' => $activeTenants,
                'inactiveTenants' => $totalTenants - $activeTenants,
                'totalUsers' => $totalUsers,
                'activeUsers' => $activeUsers,
                'totalOrders' => $totalOrders,
                'todayOrders' => $todayOrders,
                'monthlyOrders' => $monthlyOrders,
                'unpaidOrders' => $unpaidOrders,
                'totalProducts' => $totalProducts,
                'totalCustomers' => $totalCustomers,
                'totalRevenue' => (float) $totalRevenue,
                'monthlyRevenue' => (float) $monthlyRevenue,
                'todayRevenue' => (float) $todayRevenue,
                'adminUsers' => $adminUsers,
                'ownerUsers' => $ownerUsers,
            ],
            'planCounts' => [
                'free' => $planCounts['free'] ?? 0,
                'starter' => $planCounts['starter'] ?? 0,
                'pro' => $planCounts['pro'] ?? 0,
                'business' => $planCounts['business'] ?? 0,
            ],
            'revenueChart' => $revenueChart,
            'recentUsers' => $recentUsers,
            'recentOrders' => $recentOrders,
            'recentTenants' => $recentTenants,
        ]);
    }

    /**
     * Users listing with search, filter, pagination.
     */
    public function users(Request $request)
    {
        $this->authorizeAdmin();

        $query = User::with('tenant');

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status') && $request->input('status') !== 'all') {
            $query->where('is_active', $request->input('status') === 'active');
        }

        // Filter by role
        if ($role = $request->input('role')) {
            if ($role === 'admin')
                $query->where('is_admin', true);
            elseif ($role === 'owner')
                $query->where('is_owner', true);
            elseif ($role === 'staff')
                $query->where('is_admin', false)->where('is_owner', false);
        }

        // Filter by plan (via tenant)
        if ($plan = $request->input('plan')) {
            $query->whereHas('tenant', function ($q) use ($plan) {
                $q->where('plan', $plan);
            });
        }

        $users = $query->latest()->paginate(20)->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'status', 'role', 'plan']),
        ]);
    }

    /**
     * Show single user details.
     */
    public function showUser(User $user)
    {
        $this->authorizeAdmin();

        $user->load(['tenant']);

        $userOrders = Order::where('user_id', $user->id)
            ->with('customer')
            ->latest()
            ->take(20)
            ->get();

        $userStats = [
            'totalOrders' => Order::where('user_id', $user->id)->count(),
            'totalRevenue' => (float) Order::where('user_id', $user->id)->where('payment_status', 'paid')->sum('total'),
        ];

        $tenants = Tenant::select('id', 'name', 'business_name', 'plan')->get();

        return Inertia::render('Admin/Users/Show', [
            'user' => $user,
            'userOrders' => $userOrders,
            'userStats' => $userStats,
            'tenants' => $tenants,
        ]);
    }

    /**
     * Show create user form.
     */
    public function createUser()
    {
        $this->authorizeAdmin();

        $tenants = Tenant::select('id', 'name', 'business_name', 'plan')->get();

        return Inertia::render('Admin/Users/Create', [
            'tenants' => $tenants,
        ]);
    }

    /**
     * Store a new user.
     */
    public function storeUser(Request $request)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
            'tenant_id' => 'nullable|exists:tenants,id',
            'is_admin' => 'boolean',
            'is_owner' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        $validated['is_admin'] = $validated['is_admin'] ?? false;
        $validated['is_owner'] = $validated['is_owner'] ?? false;
        $validated['is_active'] = $validated['is_active'] ?? true;

        User::create($validated);

        return redirect()->route('admin.users')->with('success', 'User created successfully.');
    }

    /**
     * Update user details.
     */
    public function updateUser(Request $request, User $user)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8',
            'tenant_id' => 'nullable|exists:tenants,id',
            'is_admin' => 'sometimes|boolean',
            'is_owner' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
        ]);

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        // If tenant plan change is requested
        if ($request->has('tenant_plan') && $user->tenant) {
            $user->tenant->update(['plan' => $request->input('tenant_plan')]);
        }

        return redirect()->back()->with('success', 'User updated successfully.');
    }

    /**
     * Delete (soft-delete) a user.
     */
    public function destroyUser(User $user)
    {
        $this->authorizeAdmin();

        $user->delete();

        return redirect()->route('admin.users')->with('success', 'User deleted successfully.');
    }

    /**
     * Tenants listing with search, filter, pagination.
     */
    public function tenants(Request $request)
    {
        $this->authorizeAdmin();

        $query = Tenant::withCount(['users', 'orders', 'products', 'customers']);

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('business_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by plan
        if ($plan = $request->input('plan')) {
            $query->where('plan', $plan);
        }

        // Filter by status
        if ($request->has('status') && $request->input('status') !== 'all') {
            $query->where('is_active', $request->input('status') === 'active');
        }

        // Add revenue as a sub-select
        $query->addSelect([
            'revenue' => Order::selectRaw('COALESCE(SUM(total), 0)')
                ->whereColumn('orders.tenant_id', 'tenants.id')
                ->where('payment_status', 'paid'),
        ]);

        $tenants = $query->latest()->paginate(20)->withQueryString();

        return Inertia::render('Admin/Tenants/Index', [
            'tenants' => $tenants,
            'filters' => $request->only(['search', 'plan', 'status']),
        ]);
    }

    /**
     * Show single tenant details.
     */
    public function showTenant(Tenant $tenant)
    {
        $this->authorizeAdmin();

        $tenant->loadCount(['users', 'orders', 'products', 'customers']);

        $tenantUsers = User::where('tenant_id', $tenant->id)->get();

        $tenantRevenue = (float) Order::where('tenant_id', $tenant->id)
            ->where('payment_status', 'paid')
            ->sum('total');

        $monthlyRevenue = (float) Order::where('tenant_id', $tenant->id)
            ->where('payment_status', 'paid')
            ->where('created_at', '>=', now()->startOfMonth())
            ->sum('total');

        $recentOrders = Order::where('tenant_id', $tenant->id)
            ->with('customer')
            ->latest()
            ->take(10)
            ->get();

        $orderStats = [
            'total' => Order::where('tenant_id', $tenant->id)->count(),
            'paid' => Order::where('tenant_id', $tenant->id)->where('payment_status', 'paid')->count(),
            'unpaid' => Order::where('tenant_id', $tenant->id)->where('payment_status', 'unpaid')->count(),
            'cancelled' => Order::where('tenant_id', $tenant->id)->where('status', 'cancelled')->count(),
        ];

        // Revenue chart for this tenant — last 7 days
        $revenueChart = collect(range(6, 0))->map(function ($daysAgo) use ($tenant) {
            $date = now()->subDays($daysAgo)->startOfDay();
            return [
                'date' => $date->format('M j'),
                'revenue' => (float) Order::where('tenant_id', $tenant->id)
                    ->where('payment_status', 'paid')
                    ->whereDate('created_at', $date)
                    ->sum('total'),
                'orders' => Order::where('tenant_id', $tenant->id)
                    ->whereDate('created_at', $date)
                    ->count(),
            ];
        });

        return Inertia::render('Admin/Tenants/Show', [
            'tenant' => $tenant,
            'tenantUsers' => $tenantUsers,
            'tenantRevenue' => $tenantRevenue,
            'monthlyRevenue' => $monthlyRevenue,
            'recentOrders' => $recentOrders,
            'orderStats' => $orderStats,
            'revenueChart' => $revenueChart,
        ]);
    }

    /**
     * Update tenant details (plan, status, etc.).
     */
    public function updateTenant(Request $request, Tenant $tenant)
    {
        $this->authorizeAdmin();

        $validated = $request->validate([
            'plan' => ['sometimes', Rule::in(['free', 'starter', 'pro', 'business'])],
            'is_active' => 'sometimes|boolean',
            'subscription_ends_at' => 'nullable|date',
            'trial_ends_at' => 'nullable|date',
        ]);

        $tenant->update($validated);

        return redirect()->back()->with('success', 'Tenant updated successfully.');
    }

    /**
     * Delete (soft-delete) a tenant.
     */
    public function destroyTenant(Tenant $tenant)
    {
        $this->authorizeAdmin();

        $tenant->delete();

        return redirect()->route('admin.tenants')->with('success', 'Tenant deleted successfully.');
    }

    /**
     * Ensure the current user is a platform admin.
     */
    private function authorizeAdmin(): void
    {
        $user = auth()->user();
        if (!$user || !$user->is_admin) {
            abort(403, 'Unauthorized. Admin access required.');
        }
    }
}
