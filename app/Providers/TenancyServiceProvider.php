<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Stancl\Tenancy\Events;
use Stancl\Tenancy\Listeners;
use Stancl\Tenancy\Middleware;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;

class TenancyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureEvents();
        $this->configureRoutes();
    }

    protected function configureEvents(): void
    {
        // Tenant created
        Event::listen(Events\TenantCreated::class, function (Events\TenantCreated $event) {
            try {
                $tenant = $event->tenant;

                // Create default SMS templates
                $this->createDefaultSmsTemplates($tenant);

                // Create default categories based on business type
                $this->createDefaultCategories($tenant);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Non-critical error during tenant setup: ' . $e->getMessage(), [
                    'tenant_id' => $event->tenant->id ?? null,
                ]);
            }
        });

        // Tenancy bootstrapped
        Event::listen(Events\TenancyBootstrapped::class, function (Events\TenancyBootstrapped $event) {
            // Any initialization when tenancy context starts
        });

        // Tenancy ended
        Event::listen(Events\TenancyEnded::class, function (Events\TenancyEnded $event) {
            // Cleanup when tenancy context ends
        });
    }

    protected function configureRoutes(): void
    {
        // Include tenant routes
        Route::middleware([
            'web',
            Middleware\InitializeTenancyByDomain::class,
            Middleware\PreventAccessFromCentralDomains::class,
        ])->group(base_path('routes/tenant.php'));
    }

    protected function createDefaultSmsTemplates($tenant): void
    {
        $templates = [
            [
                'name' => 'Credit Reminder',
                'slug' => 'credit_reminder',
                'type' => 'credit_reminder',
                'content' => 'Hi {customer_name}! Ito si {store_name}. May balance ka pong ₱{balance}. Salamat po! - PadayON',
                'variables' => ['customer_name', 'balance', 'store_name', 'days_overdue'],
            ],
            [
                'name' => 'Order Confirmation',
                'slug' => 'order_confirmation',
                'type' => 'order_confirmation',
                'content' => 'Salamat {customer_name}! Order #{order_number} - ₱{total}. {store_name}',
                'variables' => ['customer_name', 'order_number', 'total', 'store_name'],
            ],
        ];

        foreach ($templates as $template) {
            \App\Models\SmsTemplate::firstOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'slug' => $template['slug'],
                ],
                [
                    'name' => $template['name'],
                    'type' => $template['type'],
                    'content' => $template['content'],
                    'variables' => $template['variables'],
                    'is_active' => true,
                    'is_system' => true,
                ]
            );
        }
    }

    protected function createDefaultCategories($tenant): void
    {
        // Map business types to their default categories
        $categoryMap = [
            'retail' => [
                'beverages' => 'Beverages',
                'snacks' => 'Snacks',
                'canned-goods' => 'Canned Goods',
                'personal-care' => 'Personal Care',
                'household' => 'Household',
                'others' => 'Others',
            ],
            'food' => [
                'appetizers' => 'Appetizers',
                'main-course' => 'Main Course',
                'desserts' => 'Desserts',
                'beverages' => 'Beverages',
                'others' => 'Others',
            ],
        ];

        $categories = $categoryMap[$tenant->business_type] ?? [];
        $type = 'product';

        $sortOrder = 0;
        foreach ($categories as $slug => $name) {
            \App\Models\Category::firstOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'slug' => $slug,
                    'type' => $type,
                ],
                [
                    'name' => $name,
                    'sort_order' => $sortOrder++,
                    'is_active' => true,
                ]
            );
        }
    }
}
