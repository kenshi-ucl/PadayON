<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Category;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class POSController extends Controller
{
    public function index(Request $request)
    {
        $categories = Category::where('type', 'product')
            ->active()
            ->orderBy('sort_order')
            ->get();

        $products = Product::active()
            ->with('category')
            ->orderBy('name')
            ->get();

        $customers = Customer::active()
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'current_balance', 'credit_limit', 'credit_enabled']);

        return Inertia::render('POS/Index', [
            'categories' => $categories,
            'products' => $products,
            'customers' => $customers,
            'settings' => [
                'currency' => config('padayon.currency'),
                'tax_rate' => config('padayon.tax.vat_rate'),
            ],
        ]);
    }

    public function createOrder(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'customer_name' => 'nullable|string|max:255',
            'customer_phone' => 'nullable|string|max:20',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.is_tingi' => 'nullable|boolean',
            'discount_type' => 'nullable|in:percentage,fixed',
            'discount_value' => 'nullable|numeric|min:0',
            'discount_reason' => 'nullable|string|max:255',
            'payment_method' => 'required|in:cash,gcash,maya,card,credit',
            'amount_paid' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'is_credit' => 'nullable|boolean',
        ]);

        DB::beginTransaction();

        try {
            $tenant = tenant();

            // Create order
            $order = Order::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $validated['customer_id'] ?? null,
                'user_id' => auth()->id(),
                'type' => 'pos',
                'status' => 'completed',
                'customer_name' => $validated['customer_name'] ?? null,
                'customer_phone' => $validated['customer_phone'] ?? null,
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'] ?? null,
                'source' => 'pos',
                'is_credit' => $validated['is_credit'] ?? false,
            ]);

            $subtotal = 0;

            // Create order items and update inventory
            foreach ($validated['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);

                $unitPrice = $itemData['unit_price'];
                $quantity = $itemData['quantity'];
                $total = $unitPrice * $quantity;
                $subtotal += $total;

                OrderItem::create([
                    'tenant_id' => $tenant->id,
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'unit_price' => $unitPrice,
                    'cost_price' => $product->cost_price,
                    'quantity' => $quantity,
                    'unit' => ($itemData['is_tingi'] ?? false) ? 'piece' : $product->stock_unit,
                    'total' => $total,
                ]);

                // Decrement stock
                if ($product->track_inventory) {
                    $product->decrementStock($quantity, 'sale', auth()->id(), $order);
                }
            }

            // Calculate totals
            $order->subtotal = $subtotal;

            // Apply discount
            if (!empty($validated['discount_type']) && !empty($validated['discount_value'])) {
                $order->applyDiscount(
                    $validated['discount_type'],
                    $validated['discount_value'],
                    $validated['discount_reason'] ?? null
                );
            } else {
                $order->calculateTotals();
            }

            // Handle payment
            if ($validated['payment_method'] === 'credit') {
                $customer = Customer::find($validated['customer_id']);

                if (!$customer || !$customer->hasAvailableCredit()) {
                    throw new \Exception('Customer does not have available credit');
                }

                if ($order->total > $customer->getAvailableCredit()) {
                    throw new \Exception('Order total exceeds available credit');
                }

                $order->is_credit = true;
                $order->credit_due_date = now()->addDays(30);
                $order->payment_status = 'unpaid';
                $order->balance_due = $order->total;

                // Record credit transaction
                $customer->addCredit($order->total, $order, "Order #{$order->order_number}");
            } else {
                $amountPaid = $validated['amount_paid'] ?? $order->total;
                $order->recordPayment($amountPaid, $validated['payment_method']);
            }

            $order->save();

            // Update customer stats
            if ($order->customer) {
                $order->customer->incrementOrderStats($order->total);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'order' => $order->load('items.product', 'customer'),
                'tenant' => [
                    'name' => tenant()->business_name ?? tenant()->name ?? 'PadayON Store',
                    'address' => tenant()->business_address ?? '',
                    'city' => tenant()->city ?? '',
                    'province' => tenant()->province ?? '',
                    'phone' => tenant()->phone ?? '',
                    'email' => tenant()->email ?? '',
                ],
                'message' => 'Order created successfully',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function searchProducts(Request $request)
    {
        $query = $request->get('q', '');

        $products = Product::active()
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('barcode', $query)
                    ->orWhere('sku', 'like', "%{$query}%");
            })
            ->with('category')
            ->take(20)
            ->get();

        return response()->json($products);
    }

    public function getProductByBarcode(Request $request)
    {
        $barcode = $request->get('barcode');

        $product = Product::active()
            ->where('barcode', $barcode)
            ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'product' => $product,
        ]);
    }

    public function quickCustomer(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
        ]);

        $customer = Customer::create([
            'tenant_id' => tenant()->id,
            'name' => $validated['name'],
            'phone' => $validated['phone'] ?? null,
            'credit_enabled' => true,
            'credit_limit' => config('padayon.sari_sari.utang.default_limit', 500),
        ]);

        return response()->json([
            'success' => true,
            'customer' => $customer,
        ]);
    }

    public function recentOrders(Request $request)
    {
        $orders = Order::with(['customer', 'items.product', 'user'])
            ->where('type', 'pos')
            ->latest()
            ->take(20)
            ->get();

        return response()->json($orders);
    }

    public function getOrder(Order $order)
    {
        return response()->json($order->load(['customer', 'items', 'payments']));
    }

    public function voidOrder(Order $order)
    {
        if (!$order->canBeCancelled()) {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be voided',
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Restore inventory
            $order->load('items.product');
            foreach ($order->items as $item) {
                if ($item->product && $item->product->track_inventory) {
                    $item->product->incrementStock($item->quantity, 'return', auth()->id(), $order);
                }
            }

            // Reverse credit if applicable
            if ($order->is_credit && $order->customer) {
                $order->customer->recordPayment($order->total, null, "Voided order #{$order->order_number}");
            }

            $order->status = 'cancelled';
            $order->payment_status = 'refunded';
            $order->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order voided successfully',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
