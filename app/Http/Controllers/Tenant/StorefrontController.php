<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Website;
use App\Models\Page;
use App\Models\Product;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\LaundryService;
use App\Models\CateringPackage;
use App\Models\Order;
use App\Models\Customer;
use App\Services\PayMongoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StorefrontController extends Controller
{
    public function index()
    {
        $tenant = tenant();
        $website = Website::where('tenant_id', $tenant->id)->first();

        if (!$website || !$website->is_published) {
            abort(404, 'Store not found');
        }

        $homepage = Page::where('tenant_id', $tenant->id)
            ->where('is_homepage', true)
            ->where('is_published', true)
            ->first();

        $navPages = Page::where('tenant_id', $tenant->id)
            ->where('is_published', true)
            ->where('show_in_nav', true)
            ->orderBy('sort_order')
            ->get(['id', 'title', 'slug']);

        // Featured products for sari-sari
        $featuredProducts = [];
        if ($tenant->business_type === 'sari_sari') {
            $featuredProducts = Product::active()
                ->featured()
                ->take(8)
                ->get();
        }

        // Featured menu items for catering
        $featuredMenu = [];
        if ($tenant->business_type === 'catering') {
            $featuredMenu = MenuItem::active()
                ->featured()
                ->take(8)
                ->get();
        }

        return Inertia::render('Storefront/Index', [
            'tenant' => $tenant->only(['name', 'business_name', 'business_type', 'phone', 'email']),
            'website' => $website,
            'homepage' => $homepage,
            'navPages' => $navPages,
            'featuredProducts' => $featuredProducts,
            'featuredMenu' => $featuredMenu,
        ]);
    }

    public function menu()
    {
        $tenant = tenant();

        if ($tenant->business_type !== 'catering') {
            abort(404);
        }

        $categories = Category::where('type', 'menu')
            ->active()
            ->with([
                'menuItems' => function ($query) {
                    $query->active()->orderBy('sort_order');
                }
            ])
            ->orderBy('sort_order')
            ->get();

        $packages = CateringPackage::active()
            ->orderBy('price_per_head')
            ->get();

        return Inertia::render('Storefront/Menu', [
            'tenant' => $tenant->only(['name', 'business_name', 'phone', 'email']),
            'categories' => $categories,
            'packages' => $packages,
        ]);
    }

    public function services()
    {
        $tenant = tenant();

        if ($tenant->business_type !== 'laundry') {
            abort(404);
        }

        $services = LaundryService::active()
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Storefront/Services', [
            'tenant' => $tenant->only(['name', 'business_name', 'phone', 'email']),
            'services' => $services,
        ]);
    }

    public function placeOrder(Request $request, PayMongoService $payMongoService)
    {
        $tenant = tenant();

        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'customer_email' => 'nullable|email',
            'customer_address' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'nullable|exists:products,id',
            'items.*.menu_item_id' => 'nullable|exists:menu_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string|max:500',
            'payment_method' => 'required|in:gcash,maya,card,cod',
            'delivery_address' => 'nullable|string',
            'delivery_date' => 'nullable|date',
            'delivery_slot' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // Find or create customer
            $customer = Customer::firstOrCreate(
                ['tenant_id' => $tenant->id, 'phone' => $validated['customer_phone']],
                [
                    'name' => $validated['customer_name'],
                    'email' => $validated['customer_email'],
                    'address' => $validated['customer_address'],
                ]
            );

            // Calculate totals
            $subtotal = 0;
            $itemsData = [];

            foreach ($validated['items'] as $item) {
                if (isset($item['product_id'])) {
                    $product = Product::find($item['product_id']);
                    $unitPrice = $product->selling_price;
                    $name = $product->name;
                } elseif (isset($item['menu_item_id'])) {
                    $menuItem = MenuItem::find($item['menu_item_id']);
                    $unitPrice = $menuItem->price;
                    $name = $menuItem->name;
                } else {
                    continue;
                }

                $total = $unitPrice * $item['quantity'];
                $subtotal += $total;

                $itemsData[] = [
                    'product_id' => $item['product_id'] ?? null,
                    'name' => $name,
                    'unit_price' => $unitPrice,
                    'quantity' => $item['quantity'],
                    'total' => $total,
                ];
            }

            // Calculate delivery fee
            $deliveryFee = 0;
            if (!empty($validated['delivery_address'])) {
                $deliveryFee = config('padayon.delivery.base_fee', 50);
            }

            $total = $subtotal + $deliveryFee;

            // Create order
            $order = Order::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $customer->id,
                'type' => 'online',
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'customer_name' => $validated['customer_name'],
                'customer_phone' => $validated['customer_phone'],
                'customer_email' => $validated['customer_email'],
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total' => $total,
                'balance_due' => $total,
                'payment_method' => $validated['payment_method'],
                'is_delivery' => !empty($validated['delivery_address']),
                'delivery_address' => $validated['delivery_address'],
                'delivery_date' => $validated['delivery_date'],
                'delivery_slot' => $validated['delivery_slot'],
                'notes' => $validated['notes'],
                'source' => 'website',
            ]);

            // Create order items
            foreach ($itemsData as $itemData) {
                $order->items()->create([
                    'tenant_id' => $tenant->id,
                    ...$itemData,
                ]);
            }

            // Handle payment
            if ($validated['payment_method'] === 'cod') {
                DB::commit();

                return response()->json([
                    'success' => true,
                    'order' => $order,
                    'message' => 'Order placed! Pay upon delivery.',
                ]);
            }

            // Create PayMongo checkout session
            $session = $payMongoService->createCheckoutSession(
                $order,
                [],
                url("/store/order/{$order->id}/track?payment=success"),
                url("/store/order/{$order->id}/track?payment=failed")
            );

            $order->update([
                'gateway_checkout_id' => $session['id'],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'order' => $order,
                'checkout_url' => $session['attributes']['checkout_url'],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function trackOrder(Order $order)
    {
        $order->load(['items', 'payments']);

        return Inertia::render('Storefront/TrackOrder', [
            'order' => $order,
            'tenant' => tenant()->only(['name', 'business_name', 'phone']),
        ]);
    }

    public function page(string $slug)
    {
        $page = Page::where('tenant_id', tenant()->id)
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();

        $website = Website::where('tenant_id', tenant()->id)->first();

        $navPages = Page::where('tenant_id', tenant()->id)
            ->where('is_published', true)
            ->where('show_in_nav', true)
            ->orderBy('sort_order')
            ->get(['id', 'title', 'slug']);

        return Inertia::render('Storefront/Page', [
            'page' => $page,
            'website' => $website,
            'navPages' => $navPages,
            'tenant' => tenant()->only(['name', 'business_name', 'phone', 'email']),
        ]);
    }
}
