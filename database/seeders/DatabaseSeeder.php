<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Category;
use App\Models\Order;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create platform admin
        User::create([
            'name' => 'PadayON Admin',
            'email' => 'admin@padayon.ph',
            'password' => Hash::make('password'),
            'is_admin' => true,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // Create demo sari-sari store
        $this->createSariSariDemo();


    }

    protected function createSariSariDemo(): void
    {
        $tenant = Tenant::create([
            'id' => Str::uuid()->toString(),
            'name' => 'Aling Maria Store',
            'slug' => 'aling-maria',
            'business_type' => 'sari_sari',
            'plan' => 'starter',
            'email' => 'demo-sari@padayon.ph',
            'phone' => '09171234567',
            'business_name' => 'Aling Maria Store',
            'business_address' => '123 Barangay Uno',
            'city' => 'Quezon City',
            'province' => 'Metro Manila',
            'region' => 'NCR',
            'is_active' => true,
            'trial_ends_at' => now()->addDays(14),
        ]);

        $tenant->domains()->create([
            'domain' => 'aling-maria.padayon.ph',
            'is_primary' => true,
        ]);

        // Create owner
        $owner = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Maria Santos',
            'email' => 'maria@demo.padayon.ph',
            'password' => Hash::make('password'),
            'is_owner' => true,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // Create categories
        $categories = [
            'beverages' => 'Inumin',
            'snacks' => 'Meryenda',
            'canned' => 'De Lata',
            'sachets' => 'Tingi',
            'cigarettes' => 'Sigarilyo',
            'personal' => 'Pansarili',
        ];

        $categoryModels = [];
        $sortOrder = 0;
        foreach ($categories as $slug => $name) {
            $categoryModels[$slug] = Category::firstOrCreate(
                [
                    'tenant_id' => $tenant->id,
                    'slug' => $slug,
                    'type' => 'product',
                ],
                [
                    'name' => $name,
                    'sort_order' => $sortOrder++,
                    'is_active' => true,
                ]
            );
        }

        // Create products
        $products = [
            ['name' => 'Coca-Cola 1.5L', 'category' => 'beverages', 'cost' => 45, 'price' => 55, 'stock' => 24],
            ['name' => 'Royal 500ml', 'category' => 'beverages', 'cost' => 15, 'price' => 20, 'stock' => 48],
            ['name' => 'C2 Apple', 'category' => 'beverages', 'cost' => 18, 'price' => 25, 'stock' => 36],
            ['name' => 'Kopiko 78', 'category' => 'beverages', 'cost' => 22, 'price' => 30, 'stock' => 24],
            ['name' => 'Piattos Cheese', 'category' => 'snacks', 'cost' => 15, 'price' => 20, 'stock' => 30],
            ['name' => 'Nova BBQ', 'category' => 'snacks', 'cost' => 8, 'price' => 12, 'stock' => 50],
            ['name' => 'Sky Flakes', 'category' => 'snacks', 'cost' => 25, 'price' => 35, 'stock' => 20],
            ['name' => 'Argentina Corned Beef', 'category' => 'canned', 'cost' => 45, 'price' => 55, 'stock' => 24],
            ['name' => 'Century Tuna', 'category' => 'canned', 'cost' => 35, 'price' => 45, 'stock' => 30],
            ['name' => 'Ligo Sardines', 'category' => 'canned', 'cost' => 20, 'price' => 28, 'stock' => 36],
            ['name' => 'Lucky Me Pancit Canton', 'category' => 'sachets', 'cost' => 10, 'price' => 14, 'stock' => 100, 'tingi' => true, 'tingi_price' => 14],
            ['name' => 'Nescafe 3in1', 'category' => 'sachets', 'cost' => 6, 'price' => 9, 'stock' => 200, 'tingi' => true, 'tingi_price' => 9],
            ['name' => 'Tide Powder', 'category' => 'sachets', 'cost' => 5, 'price' => 8, 'stock' => 150, 'tingi' => true, 'tingi_price' => 8],
            ['name' => 'Marlboro Red', 'category' => 'cigarettes', 'cost' => 150, 'price' => 175, 'stock' => 20],
            ['name' => 'Fortune Menthol', 'category' => 'cigarettes', 'cost' => 100, 'price' => 120, 'stock' => 30],
            ['name' => 'Safeguard Soap', 'category' => 'personal', 'cost' => 35, 'price' => 45, 'stock' => 24],
            ['name' => 'Colgate Toothpaste', 'category' => 'personal', 'cost' => 50, 'price' => 65, 'stock' => 18],
        ];

        foreach ($products as $product) {
            Product::create([
                'tenant_id' => $tenant->id,
                'category_id' => $categoryModels[$product['category']]->id,
                'name' => $product['name'],
                'cost_price' => $product['cost'],
                'selling_price' => $product['price'],
                'stock_quantity' => $product['stock'],
                'low_stock_threshold' => 10,
                'stock_unit' => 'piece',
                'track_inventory' => true,
                'allow_tingi' => $product['tingi'] ?? false,
                'tingi_price' => $product['tingi_price'] ?? null,
                'is_active' => true,
            ]);
        }

        // Create customers with utang
        $customers = [
            ['name' => 'Juan dela Cruz', 'phone' => '09171111111', 'balance' => 250],
            ['name' => 'Pedro Penduko', 'phone' => '09172222222', 'balance' => 500],
            ['name' => 'Jose Rizal', 'phone' => '09173333333', 'balance' => 0],
            ['name' => 'Gabriela Silang', 'phone' => '09174444444', 'balance' => 150],
            ['name' => 'Andres Bonifacio', 'phone' => '09175555555', 'balance' => 350],
        ];

        foreach ($customers as $customer) {
            Customer::create([
                'tenant_id' => $tenant->id,
                'name' => $customer['name'],
                'phone' => $customer['phone'],
                'credit_limit' => 500,
                'current_balance' => $customer['balance'],
                'credit_enabled' => true,
                'is_active' => true,
                'last_credit_date' => $customer['balance'] > 0 ? now()->subDays(rand(1, 30)) : null,
            ]);
        }
    }


}
