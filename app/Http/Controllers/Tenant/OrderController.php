<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class OrderController extends Controller
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

    public function index(Request $request)
    {
        $query = Order::with(['customer', 'user', 'items']);

        // Filters
        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        if ($paymentStatus = $request->get('payment_status')) {
            $query->where('payment_status', $paymentStatus);
        }

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Date range
        if ($from = $request->get('from')) {
            $query->whereDate('created_at', '>=', $from);
        }
        if ($to = $request->get('to')) {
            $query->whereDate('created_at', '<=', $to);
        }

        $orders = $query->latest()->paginate(20);

        $stats = [
            'total' => Order::count(),
            'today' => Order::today()->count(),
            'pending' => Order::unpaid()->count(),
            'total_revenue' => Order::paid()->sum('total'),
        ];

        return Inertia::render('Orders/Index', [
            'orders' => $orders,
            'stats' => $stats,
            'filters' => $request->only(['type', 'status', 'payment_status', 'search', 'from', 'to']),
        ]);
    }

    public function show(Order $order)
    {
        $order->load([
            'customer',
            'user',
            'items.product',
            'payments',
        ]);

        $tenant = $this->getTenant();

        return Inertia::render('Orders/Show', [
            'order' => $order,
            'receiptInfo' => [
                'name' => $tenant->business_name ?? $tenant->name ?? 'PadayON Store',
                'address' => $tenant->business_address ?? '',
                'city' => $tenant->city ?? '',
                'province' => $tenant->province ?? '',
                'phone' => $tenant->phone ?? '',
                'email' => $tenant->email ?? '',
            ],
        ]);
    }

    public function receipt(Order $order)
    {
        $order->load(['customer', 'items', 'payments']);

        return Inertia::render('Orders/Receipt', [
            'order' => $order,
            'tenant' => tenant(),
        ]);
    }

    public function invoice(Order $order)
    {
        $order->load(['customer', 'items', 'payments']);
        $tenant = tenant();

        $pdf = Pdf::loadView('pdf.invoice', [
            'order' => $order,
            'tenant' => $tenant,
        ]);

        return $pdf->download("Invoice-{$order->order_number}.pdf");
    }

    public function recordPayment(Request $request, Order $order)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . $order->balance_due,
            'method' => 'required|in:cash,gcash,maya,card',
            'reference' => 'nullable|string|max:100',
        ]);

        try {
            $order->recordPayment(
                (float) $validated['amount'],
                $validated['method'],
                $validated['reference'] ?? null
            );

            // If customer exists and this was a credit order, update their balance
            if ($order->is_credit && $order->customer) {
                $order->customer->recordPayment(
                    (float) $validated['amount'],
                    null,
                    "Payment for Order #{$order->order_number}"
                );
            }

            return back()->with('success', 'Payment recorded successfully');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function refund(Request $request, Order $order)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . $order->amount_paid,
            'reason' => 'required|string|max:500',
        ]);

        \DB::beginTransaction();

        try {
            // Create refund payment record with retry for payment number collisions
            $payment = null;
            $maxAttempts = 5;
            for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
                try {
                    $payment = Payment::create([
                        'tenant_id' => tenant()->id,
                        'order_id' => $order->id,
                        'customer_id' => $order->customer_id,
                        'user_id' => auth()->id(),
                        'payment_number' => Payment::generatePaymentNumber(tenant()->id),
                        'type' => 'refund',
                        'amount' => -$validated['amount'],
                        'fee' => 0,
                        'net_amount' => -$validated['amount'],
                        'method' => $order->payment_method,
                        'gateway' => 'manual',
                        'status' => 'completed',
                        'notes' => $validated['reason'],
                        'paid_at' => now(),
                    ]);
                    break;
                } catch (\Illuminate\Database\QueryException $e) {
                    if ($attempt < $maxAttempts && str_contains($e->getMessage(), 'payment_number')) {
                        continue;
                    }
                    throw $e;
                }
            }

            // Update order
            $order->amount_paid -= $validated['amount'];
            $order->balance_due += $validated['amount'];

            if ($order->amount_paid <= 0) {
                $order->payment_status = 'refunded';
                $order->status = 'refunded';
            } else {
                $order->payment_status = 'partial';
            }

            $order->save();

            // Restore inventory if applicable
            if ($order->type === 'pos') {
                foreach ($order->items as $item) {
                    if ($item->product && $item->product->track_inventory) {
                        $item->product->incrementStock(
                            $item->quantity,
                            'return',
                            auth()->id(),
                            $order,
                            "Refund: {$validated['reason']}"
                        );
                    }
                }
            }

            \DB::commit();

            return back()->with('success', 'Refund processed successfully');

        } catch (\Exception $e) {
            \DB::rollBack();
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
