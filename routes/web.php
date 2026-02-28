<?php

use App\Http\Controllers\Auth\AuthController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes (Central Domain)
|--------------------------------------------------------------------------
*/

// Landing page
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'plans' => config('padayon.plans'),
    ]);
})->name('home');

// Authentication routes
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
    Route::get('/forgot-password', [AuthController::class, 'showForgotPassword'])->name('password.request');
    Route::post('/forgot-password', [AuthController::class, 'sendResetLink'])->name('password.email');
    Route::get('/reset-password/{token}', [AuthController::class, 'showResetPassword'])->name('password.reset');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.update');
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// Dashboard route for local development (tenant users accessing from central domain)
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        $user = auth()->user();

        if ($user->is_admin) {
            return redirect('/admin');
        }

        // Get tenant info for the dashboard
        $tenant = \App\Models\Tenant::find($user->tenant_id);

        if (!$tenant) {
            return Inertia::render('Tenant/Dashboard', [
                'tenant' => null,
                'user' => $user,
            ]);
        }

        // Set tenant context for local development
        app()->instance('currentTenant', $tenant);

        $today = now()->startOfDay();
        $startOfWeek = now()->startOfWeek();
        $startOfMonth = now()->startOfMonth();

        // Today's stats
        $todayStats = [
            'orders' => \App\Models\Order::where('tenant_id', $tenant->id)->whereDate('created_at', $today)->count(),
            'revenue' => \App\Models\Order::where('tenant_id', $tenant->id)->whereDate('created_at', $today)
                ->where('payment_status', 'paid')
                ->sum('total'),
            'customers' => \App\Models\Customer::where('tenant_id', $tenant->id)->whereDate('created_at', $today)->count(),
        ];

        // This week's stats
        $weekStats = [
            'orders' => \App\Models\Order::where('tenant_id', $tenant->id)->where('created_at', '>=', $startOfWeek)->count(),
            'revenue' => \App\Models\Order::where('tenant_id', $tenant->id)->where('created_at', '>=', $startOfWeek)
                ->where('payment_status', 'paid')
                ->sum('total'),
        ];

        // This month's stats
        $monthOrders = \App\Models\Order::where('tenant_id', $tenant->id)->where('created_at', '>=', $startOfMonth);
        $monthStats = [
            'orders' => $monthOrders->count(),
            'revenue' => (clone $monthOrders)->where('payment_status', 'paid')->sum('total'),
            'average_order' => (clone $monthOrders)->where('payment_status', 'paid')->avg('total') ?? 0,
        ];

        // Recent orders
        $recentOrders = \App\Models\Order::where('tenant_id', $tenant->id)
            ->with(['customer'])
            ->latest()
            ->take(10)
            ->get();

        // Chart data - last 7 days
        $chartData = collect(range(6, 0))->map(function ($daysAgo) use ($tenant) {
            $date = now()->subDays($daysAgo)->startOfDay();
            return [
                'date' => $date->format('M j'),
                'revenue' => \App\Models\Order::where('tenant_id', $tenant->id)
                    ->whereDate('created_at', $date)
                    ->where('payment_status', 'paid')
                    ->sum('total'),
                'orders' => \App\Models\Order::where('tenant_id', $tenant->id)
                    ->whereDate('created_at', $date)
                    ->count(),
            ];
        });

        // Low stock products
        $lowStockProducts = \App\Models\Product::where('tenant_id', $tenant->id)
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->where('is_active', true)
            ->take(5)
            ->get(['id', 'name', 'stock_quantity', 'low_stock_threshold']);

        // Customers with credit (utang)
        $customersWithCredit = \App\Models\Customer::where('tenant_id', $tenant->id)
            ->where('current_balance', '>', 0)
            ->orderByDesc('current_balance')
            ->take(5)
            ->get(['id', 'name', 'current_balance', 'last_credit_date']);

        $totalCredit = \App\Models\Customer::where('tenant_id', $tenant->id)
            ->where('current_balance', '>', 0)
            ->sum('current_balance');

        return Inertia::render('Dashboard/Index', [
            'tenant' => $tenant,
            'todayStats' => $todayStats,
            'weekStats' => $weekStats,
            'monthStats' => $monthStats,
            'recentOrders' => $recentOrders,
            'chartData' => $chartData,
            'lowStockProducts' => $lowStockProducts,
            'customersWithCredit' => $customersWithCredit,
            'totalCredit' => $totalCredit,
        ]);
    })->name('dashboard');

    // Admin Monitoring Dashboard
    Route::prefix('admin')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\AdminController::class, 'dashboard'])->name('admin.dashboard');

        // Users Management
        Route::get('/users', [\App\Http\Controllers\Admin\AdminController::class, 'users'])->name('admin.users');
        Route::get('/users/create', [\App\Http\Controllers\Admin\AdminController::class, 'createUser'])->name('admin.users.create');
        Route::post('/users', [\App\Http\Controllers\Admin\AdminController::class, 'storeUser'])->name('admin.users.store');
        Route::get('/users/{user}', [\App\Http\Controllers\Admin\AdminController::class, 'showUser'])->name('admin.users.show');
        Route::patch('/users/{user}', [\App\Http\Controllers\Admin\AdminController::class, 'updateUser'])->name('admin.users.update');
        Route::delete('/users/{user}', [\App\Http\Controllers\Admin\AdminController::class, 'destroyUser'])->name('admin.users.destroy');

        // Tenants/Stores Management
        Route::get('/tenants', [\App\Http\Controllers\Admin\AdminController::class, 'tenants'])->name('admin.tenants');
        Route::get('/tenants/{tenant}', [\App\Http\Controllers\Admin\AdminController::class, 'showTenant'])->name('admin.tenants.show');
        Route::patch('/tenants/{tenant}', [\App\Http\Controllers\Admin\AdminController::class, 'updateTenant'])->name('admin.tenants.update');
        Route::delete('/tenants/{tenant}', [\App\Http\Controllers\Admin\AdminController::class, 'destroyTenant'])->name('admin.tenants.destroy');
    });
});

// Pricing page
Route::get('/pricing', function () {
    return Inertia::render('Pricing', [
        'plans' => config('padayon.plans'),
    ]);
})->name('pricing');

// Features page
Route::get('/features', function () {
    return Inertia::render('Features');
})->name('features');

// About page
Route::get('/about', function () {
    return Inertia::render('About');
})->name('about');

// Contact page
Route::get('/contact', function () {
    return Inertia::render('Contact');
})->name('contact');

// PayMongo Webhooks (no CSRF)
Route::post('/webhooks/paymongo', [\App\Http\Controllers\Api\WebhookController::class, 'paymongo'])
    ->withoutMiddleware(['web', 'csrf']);

// Serve storage files directly (bypasses symlink issues with PHP dev server + ngrok)
Route::get('/storage/{path}', function (string $path) {
    $fullPath = storage_path('app/public/' . $path);

    if (!file_exists($fullPath)) {
        abort(404);
    }

    $mimeType = mime_content_type($fullPath) ?: 'application/octet-stream';

    return response()->file($fullPath, [
        'Content-Type' => $mimeType,
        'Cache-Control' => 'public, max-age=31536000',
    ]);
})->where('path', '.*');

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]);
});

// ============================================================================
// LOCAL DEVELOPMENT TENANT ROUTES
// These routes allow access to tenant features from the central domain
// In production, these are served from tenant subdomains via tenant.php
// ============================================================================
Route::middleware(['auth', 'set-tenant'])->group(function () {

    // POS (for all business types)
    Route::get('/pos', [\App\Http\Controllers\Tenant\POSController::class, 'index'])->name('pos');
    Route::post('/pos/orders', [\App\Http\Controllers\Tenant\POSController::class, 'createOrder']);
    Route::get('/pos/search-products', [\App\Http\Controllers\Tenant\POSController::class, 'searchProducts']);
    Route::get('/pos/barcode', [\App\Http\Controllers\Tenant\POSController::class, 'getProductByBarcode']);
    Route::post('/pos/quick-customer', [\App\Http\Controllers\Tenant\POSController::class, 'quickCustomer']);
    Route::get('/pos/recent-orders', [\App\Http\Controllers\Tenant\POSController::class, 'recentOrders']);

    // Products
    Route::get('/products', [\App\Http\Controllers\Tenant\ProductController::class, 'index'])->name('products');
    Route::get('/products/low-stock', [\App\Http\Controllers\Tenant\ProductController::class, 'lowStock']);
    Route::get('/products/create', [\App\Http\Controllers\Tenant\ProductController::class, 'create']);
    Route::post('/products', [\App\Http\Controllers\Tenant\ProductController::class, 'store']);
    Route::get('/products/{product}', [\App\Http\Controllers\Tenant\ProductController::class, 'show']);
    Route::get('/products/{product}/edit', [\App\Http\Controllers\Tenant\ProductController::class, 'edit']);
    Route::patch('/products/{product}', [\App\Http\Controllers\Tenant\ProductController::class, 'update']);
    Route::delete('/products/{product}', [\App\Http\Controllers\Tenant\ProductController::class, 'destroy']);
    Route::post('/products/{product}/adjust-stock', [\App\Http\Controllers\Tenant\ProductController::class, 'adjustStock']);

    // Customers
    Route::get('/customers', [\App\Http\Controllers\Tenant\CustomerController::class, 'index'])->name('customers');
    Route::get('/customers/create', [\App\Http\Controllers\Tenant\CustomerController::class, 'create']);
    Route::post('/customers', [\App\Http\Controllers\Tenant\CustomerController::class, 'store']);
    Route::get('/customers/credit-report', [\App\Http\Controllers\Tenant\CustomerController::class, 'creditReport']);
    Route::get('/customers/{customer}', [\App\Http\Controllers\Tenant\CustomerController::class, 'show']);
    Route::get('/customers/{customer}/edit', [\App\Http\Controllers\Tenant\CustomerController::class, 'edit']);
    Route::patch('/customers/{customer}', [\App\Http\Controllers\Tenant\CustomerController::class, 'update']);
    Route::post('/customers/{customer}/payment', [\App\Http\Controllers\Tenant\CustomerController::class, 'recordPayment']);
    Route::post('/customers/{customer}/send-reminder', [\App\Http\Controllers\Tenant\CustomerController::class, 'sendReminder']);

    // Orders
    Route::get('/orders', [\App\Http\Controllers\Tenant\OrderController::class, 'index'])->name('orders');
    Route::get('/orders/{order}', [\App\Http\Controllers\Tenant\OrderController::class, 'show']);
    Route::post('/orders/{order}/payment', [\App\Http\Controllers\Tenant\OrderController::class, 'recordPayment']);
    Route::patch('/orders/{order}/status', [\App\Http\Controllers\Tenant\OrderController::class, 'updateStatus']);

    // Reports
    Route::get('/reports', [\App\Http\Controllers\Tenant\DashboardController::class, 'reports'])->name('reports');
    Route::get('/reports/sales', [\App\Http\Controllers\Tenant\ReportController::class, 'sales'])->name('reports.sales');
    Route::get('/reports/inventory', [\App\Http\Controllers\Tenant\ReportController::class, 'inventory'])->name('reports.inventory');
    Route::get('/reports/customers', [\App\Http\Controllers\Tenant\ReportController::class, 'customers'])->name('reports.customers');
    Route::get('/reports/credits', [\App\Http\Controllers\Tenant\ReportController::class, 'credits'])->name('reports.credits');
    Route::get('/reports/export/{type}', [\App\Http\Controllers\Tenant\ReportController::class, 'export'])->name('reports.export');

    // Settings
    Route::get('/settings', [\App\Http\Controllers\Tenant\SettingsController::class, 'index'])->name('settings');
    Route::patch('/settings', [\App\Http\Controllers\Tenant\SettingsController::class, 'update']);
    Route::patch('/settings/business', [\App\Http\Controllers\Tenant\SettingsController::class, 'updateBusiness']);
    Route::patch('/settings/payment', [\App\Http\Controllers\Tenant\SettingsController::class, 'updatePayment']);
    Route::patch('/settings/notifications', [\App\Http\Controllers\Tenant\SettingsController::class, 'updateNotifications']);
    Route::patch('/settings/sms', [\App\Http\Controllers\Tenant\SettingsController::class, 'updateSms']);

    // Settings — Category Management
    Route::post('/settings/categories', [\App\Http\Controllers\Tenant\SettingsController::class, 'storeCategory']);
    Route::patch('/settings/categories/{category}', [\App\Http\Controllers\Tenant\SettingsController::class, 'updateCategory']);
    Route::delete('/settings/categories/{category}', [\App\Http\Controllers\Tenant\SettingsController::class, 'destroyCategory']);

    // Scanner (QR Code)
    Route::get('/scanner', [\App\Http\Controllers\Tenant\ScannerController::class, 'index'])->name('scanner');
    Route::post('/scanner/lookup', [\App\Http\Controllers\Tenant\ScannerController::class, 'lookupQr']);
    Route::post('/scanner/charge', [\App\Http\Controllers\Tenant\ScannerController::class, 'chargeItems']);
});
