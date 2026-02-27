<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ScannerController extends Controller
{
    public function index()
    {
        $customers = Customer::active()
            ->orderBy('name')
            ->get(['id', 'name', 'phone', 'current_balance', 'credit_limit', 'credit_enabled']);

        return Inertia::render('Scanner/Index', [
            'customers' => $customers,
            'settings' => [
                'currency' => config('padayon.currency'),
                'tax_rate' => config('padayon.tax.vat_rate'),
            ],
        ]);
    }

    public function lookupQr(Request $request)
    {
        $validated = $request->validate([
            'qr_token' => 'required|string',
        ]);

        $qrToken = $validated['qr_token'];

        // Parse token: may be in format "tenant_id:qr_token" or just "qr_token"
        if (str_contains($qrToken, ':')) {
            $parts = explode(':', $qrToken, 2);
            $qrToken = $parts[1];
        }

        $product = Product::where('qr_token', $qrToken)->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found. This QR code is invalid.',
            ], 404);
        }

        // Security: Ensure the product belongs to the current user's tenant
        $userTenantId = auth()->user()->tenant_id;
        if ($product->tenant_id !== $userTenantId) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. This product does not belong to your store.',
            ], 403);
        }

        if (!$product->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'This product is currently inactive.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'product' => $product->load('category'),
        ]);
    }

    public function chargeItems(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,gcash,maya,card,credit',
            'amount_paid' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'is_credit' => 'nullable|boolean',
        ]);

        DB::beginTransaction();

        try {
            $tenant = tenant();
            $userTenantId = auth()->user()->tenant_id;

            // Verify all products belong to this tenant
            foreach ($validated['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                if ($product->tenant_id !== $userTenantId) {
                    throw new \Exception('Unauthorized: One or more products do not belong to your store.');
                }
            }

            $order = Order::create([
                'tenant_id' => $tenant->id,
                'customer_id' => $validated['customer_id'] ?? null,
                'user_id' => auth()->id(),
                'type' => 'pos',
                'status' => 'completed',
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'] ?? null,
                'source' => 'scanner',
                'is_credit' => $validated['is_credit'] ?? false,
            ]);

            $subtotal = 0;

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
                    'unit' => $product->stock_unit,
                    'total' => $total,
                ]);

                if ($product->track_inventory) {
                    $product->decrementStock($quantity, 'sale', auth()->id(), $order);
                }
            }

            $order->subtotal = $subtotal;
            $order->calculateTotals();

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

                $customer->addCredit($order->total, $order, "Order #{$order->order_number}");
            } else {
                $amountPaid = $validated['amount_paid'] ?? $order->total;
                $order->recordPayment($amountPaid, $validated['payment_method']);
            }

            $order->save();

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
                    'phone' => tenant()->phone ?? '',
                    'email' => tenant()->email ?? '',
                ],
                'message' => 'Order charged successfully',
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
