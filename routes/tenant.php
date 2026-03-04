<?php

declare(strict_types=1);

use App\Http\Controllers\Tenant\DashboardController;
use App\Http\Controllers\Tenant\POSController;

use App\Http\Controllers\Tenant\CustomerController;
use App\Http\Controllers\Tenant\NotificationController;
use App\Http\Controllers\Tenant\ProductController;
use App\Http\Controllers\Tenant\OrderController;
use App\Http\Controllers\Tenant\SettingsController;
use App\Http\Controllers\Tenant\ReportController;
use App\Http\Controllers\Tenant\WebsiteController;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
*/

Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
    'auth',
])->group(function () {

    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('tenant.dashboard');
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/reports', [DashboardController::class, 'reports'])->name('tenant.reports');

    // POS
    Route::prefix('pos')->name('tenant.pos.')->group(function () {
        Route::get('/', [POSController::class, 'index'])->name('index');
        Route::post('/orders', [POSController::class, 'createOrder'])->name('create-order');
        Route::get('/search-products', [POSController::class, 'searchProducts'])->name('search-products');
        Route::get('/barcode', [POSController::class, 'getProductByBarcode'])->name('barcode');
        Route::post('/quick-customer', [POSController::class, 'quickCustomer'])->name('quick-customer');
        Route::get('/recent-orders', [POSController::class, 'recentOrders'])->name('recent-orders');
        Route::get('/orders/{order}', [POSController::class, 'getOrder'])->name('get-order');
        Route::post('/orders/{order}/void', [POSController::class, 'voidOrder'])->name('void-order');
    });



    // Customers
    Route::prefix('customers')->name('tenant.customers.')->group(function () {
        Route::get('/', [CustomerController::class, 'index'])->name('index');
        Route::get('/create', [CustomerController::class, 'create'])->name('create');
        Route::post('/', [CustomerController::class, 'store'])->name('store');
        Route::get('/credit-report', [CustomerController::class, 'creditReport'])->name('credit-report');
        Route::post('/send-bulk-reminders', [CustomerController::class, 'sendBulkReminders'])->name('send-bulk-reminders');
        Route::get('/{customer}', [CustomerController::class, 'show'])->name('show');
        Route::get('/{customer}/edit', [CustomerController::class, 'edit'])->name('edit');
        Route::patch('/{customer}', [CustomerController::class, 'update'])->name('update');
        Route::post('/{customer}/payment', [CustomerController::class, 'recordPayment'])->name('payment');
        Route::post('/{customer}/send-reminder', [CustomerController::class, 'sendReminder'])->name('send-reminder');
        Route::post('/{customer}/adjust-credit', [CustomerController::class, 'adjustCredit'])->name('adjust-credit');
    });

    // Products (Inventory)
    Route::prefix('products')->name('tenant.products.')->group(function () {
        Route::get('/', [ProductController::class, 'index'])->name('index');
        Route::get('/create', [ProductController::class, 'create'])->name('create');
        Route::post('/', [ProductController::class, 'store'])->name('store');
        Route::get('/low-stock', [ProductController::class, 'lowStock'])->name('low-stock');
        Route::get('/categories', [ProductController::class, 'categories'])->name('categories');
        Route::post('/categories', [ProductController::class, 'storeCategory'])->name('store-category');
        Route::get('/{product}', [ProductController::class, 'show'])->name('show');
        Route::get('/{product}/edit', [ProductController::class, 'edit'])->name('edit');
        Route::patch('/{product}', [ProductController::class, 'update'])->name('update');
        Route::delete('/{product}', [ProductController::class, 'destroy'])->name('destroy');
        Route::post('/{product}/adjust-stock', [ProductController::class, 'adjustStock'])->name('adjust-stock');
    });

    // Orders
    Route::prefix('orders')->name('tenant.orders.')->group(function () {
        Route::get('/', [OrderController::class, 'index'])->name('index');
        Route::get('/{order}', [OrderController::class, 'show'])->name('show');
        Route::get('/{order}/receipt', [OrderController::class, 'receipt'])->name('receipt');
        Route::get('/{order}/invoice', [OrderController::class, 'invoice'])->name('invoice');
        Route::post('/{order}/refund', [OrderController::class, 'refund'])->name('refund');
    });

    // Reports
    Route::prefix('reports')->name('tenant.reports.')->group(function () {
        Route::get('/sales', [ReportController::class, 'sales'])->name('sales');
        Route::get('/inventory', [ReportController::class, 'inventory'])->name('inventory');
        Route::get('/customers', [ReportController::class, 'customers'])->name('customers');
        Route::get('/credits', [ReportController::class, 'credits'])->name('credits');
        Route::get('/export/{type}', [ReportController::class, 'export'])->name('export');
    });

    // Website Builder
    Route::prefix('website')->name('tenant.website.')->group(function () {
        Route::get('/', [WebsiteController::class, 'index'])->name('index');
        Route::patch('/settings', [WebsiteController::class, 'updateSettings'])->name('settings');
        Route::get('/pages', [WebsiteController::class, 'pages'])->name('pages');
        Route::get('/pages/create', [WebsiteController::class, 'createPage'])->name('create-page');
        Route::post('/pages', [WebsiteController::class, 'storePage'])->name('store-page');
        Route::get('/pages/{page}/edit', [WebsiteController::class, 'editPage'])->name('edit-page');
        Route::patch('/pages/{page}', [WebsiteController::class, 'updatePage'])->name('update-page');
        Route::delete('/pages/{page}', [WebsiteController::class, 'deletePage'])->name('delete-page');
        Route::post('/publish', [WebsiteController::class, 'publish'])->name('publish');
        Route::post('/unpublish', [WebsiteController::class, 'unpublish'])->name('unpublish');
    });

    // Notifications
    Route::prefix('notifications')->name('tenant.notifications.')->group(function () {
        Route::get('/', [NotificationController::class, 'index'])->name('index');
        Route::get('/get', [NotificationController::class, 'getNotifications'])->name('get');
        Route::get('/unread-count', [NotificationController::class, 'unreadCount'])->name('unread-count');
        Route::post('/mark-read/{notification}', [NotificationController::class, 'markAsRead'])->name('mark-read');
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
        Route::post('/send-to-team', [NotificationController::class, 'sendToTeam'])->name('send-to-team');
        Route::get('/team-members', [NotificationController::class, 'getTeamMembers'])->name('team-members');
        Route::delete('/{notification}', [NotificationController::class, 'destroy'])->name('destroy');
    });

    // Settings
    Route::prefix('settings')->name('tenant.settings.')->group(function () {
        Route::get('/', [SettingsController::class, 'index'])->name('index');
        Route::patch('/business', [SettingsController::class, 'updateBusiness'])->name('business');
        Route::patch('/payment', [SettingsController::class, 'updatePayment'])->name('payment');
        Route::patch('/notifications', [SettingsController::class, 'updateNotifications'])->name('notifications');
        Route::get('/subscription', [SettingsController::class, 'subscription'])->name('subscription');
        Route::post('/subscription/upgrade', [SettingsController::class, 'upgrade'])->name('upgrade');
        Route::post('/subscription/cancel', [SettingsController::class, 'cancel'])->name('cancel');
        Route::get('/team', [SettingsController::class, 'team'])->name('team');
        Route::post('/team', [SettingsController::class, 'inviteTeamMember'])->name('invite');
        Route::delete('/team/{user}', [SettingsController::class, 'removeTeamMember'])->name('remove-member');
        // Category Management
        Route::post('/categories', [SettingsController::class, 'storeCategory'])->name('categories.store');
        Route::patch('/categories/{category}', [SettingsController::class, 'updateCategory'])->name('categories.update');
        Route::delete('/categories/{category}', [SettingsController::class, 'destroyCategory'])->name('categories.destroy');
    });


});

// Public tenant website (no auth required)
Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {
    // Public storefront
    Route::get('/store', [\App\Http\Controllers\Tenant\StorefrontController::class, 'index'])->name('tenant.storefront');
    Route::get('/store/menu', [\App\Http\Controllers\Tenant\StorefrontController::class, 'menu'])->name('tenant.storefront.menu');
    Route::get('/store/services', [\App\Http\Controllers\Tenant\StorefrontController::class, 'services'])->name('tenant.storefront.services');
    Route::post('/store/order', [\App\Http\Controllers\Tenant\StorefrontController::class, 'placeOrder'])->name('tenant.storefront.order');
    Route::get('/store/order/{order}/track', [\App\Http\Controllers\Tenant\StorefrontController::class, 'trackOrder'])->name('tenant.storefront.track');

    // Custom pages
    Route::get('/p/{slug}', [\App\Http\Controllers\Tenant\StorefrontController::class, 'page'])->name('tenant.page');
});
