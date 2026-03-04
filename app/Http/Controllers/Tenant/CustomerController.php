<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CreditTransaction;
use App\Models\Order;
use App\Models\Payment;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CustomerController extends Controller
{
    protected SmsService $smsService;

    public function __construct(SmsService $smsService)
    {
        $this->smsService = $smsService;
    }

    public function index(Request $request)
    {
        $filter = $request->get('filter', 'all');
        $search = $request->get('search', '');

        $query = Customer::withCount('orders')
            ->withSum('orders', 'total');

        if ($filter === 'with_credit') {
            $query->where('current_balance', '>', 0);
        } elseif ($filter === 'suki') {
            $query->where('is_suki', true);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $customers = $query->orderBy('name')->paginate(20);

        $stats = [
            'total' => Customer::count(),
            'with_credit' => Customer::where('current_balance', '>', 0)->count(),
            'total_credit' => Customer::sum('current_balance'),
            'suki' => Customer::where('is_suki', true)->count(),
        ];

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'stats' => $stats,
            'filter' => $filter,
            'search' => $search,
        ]);
    }

    public function create()
    {
        return Inertia::render('Customers/Create', [
            'defaultCreditLimit' => config('padayon.sari_sari.utang.default_limit', 500),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'barangay' => 'nullable|string|max:100',
            'is_suki' => 'boolean',
            'credit_enabled' => 'boolean',
            'credit_limit' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $customer = Customer::create([
            'tenant_id' => tenant()->id,
            ...$validated,
            'credit_limit' => $validated['credit_limit'] ?? config('padayon.sari_sari.utang.default_limit', 500),
        ]);

        return redirect('/customers/' . $customer->id)
            ->with('success', 'Customer created successfully');
    }

    public function show(Customer $customer)
    {
        $customer->load([
            'orders' => function ($query) {
                $query->latest()->take(10);
            }
        ]);

        $creditHistory = CreditTransaction::where('customer_id', $customer->id)
            ->with(['order', 'payment'])
            ->latest()
            ->take(20)
            ->get();

        $stats = [
            'total_orders' => $customer->total_orders,
            'total_spent' => $customer->total_spent,
            'average_order' => $customer->total_orders > 0
                ? $customer->total_spent / $customer->total_orders
                : 0,
            'days_as_customer' => (int) $customer->created_at->diffInDays(now()),
        ];

        return Inertia::render('Customers/Show', [
            'customer' => $customer,
            'creditHistory' => $creditHistory,
            'stats' => $stats,
        ]);
    }

    public function edit(Customer $customer)
    {
        return Inertia::render('Customers/Edit', [
            'customer' => $customer,
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'barangay' => 'nullable|string|max:100',
            'is_suki' => 'boolean',
            'credit_enabled' => 'boolean',
            'credit_limit' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $customer->update($validated);

        return redirect('/customers/' . $customer->id)
            ->with('success', 'Customer updated successfully');
    }

    public function recordPayment(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . $customer->current_balance,
            'method' => 'required|in:cash,gcash,maya,card',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // Create payment record with retry for payment number collisions
            $payment = null;
            $maxAttempts = 5;
            for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
                try {
                    $payment = Payment::create([
                        'tenant_id' => tenant()->id,
                        'customer_id' => $customer->id,
                        'user_id' => auth()->id(),
                        'payment_number' => Payment::generatePaymentNumber(tenant()->id),
                        'type' => 'credit_payment',
                        'amount' => $validated['amount'],
                        'fee' => 0,
                        'net_amount' => $validated['amount'],
                        'method' => $validated['method'],
                        'gateway' => 'manual',
                        'status' => 'completed',
                        'reference_number' => $validated['reference'] ?? null,
                        'notes' => $validated['notes'] ?? null,
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

            // Record credit transaction
            $customer->recordPayment($validated['amount'], $payment, $validated['notes']);

            // Update unpaid credit orders for this customer
            // Allocate payment to oldest orders first
            $remainingPayment = $validated['amount'];
            $unpaidOrders = Order::where('customer_id', $customer->id)
                ->where('is_credit', true)
                ->where('payment_status', '!=', 'paid')
                ->orderBy('created_at', 'asc')
                ->get();

            foreach ($unpaidOrders as $order) {
                if ($remainingPayment <= 0)
                    break;

                $balanceDue = (float) $order->balance_due;

                if ($remainingPayment >= $balanceDue) {
                    // Fully pay this order
                    $order->amount_paid = $order->total;
                    $order->balance_due = 0;
                    $order->payment_status = 'paid';
                    $order->paid_at = now();
                    $remainingPayment -= $balanceDue;
                } else {
                    // Partially pay this order
                    $order->amount_paid = (float) $order->amount_paid + $remainingPayment;
                    $order->balance_due = (float) $order->total - (float) $order->amount_paid;
                    $order->payment_status = 'partial';
                    $remainingPayment = 0;
                }

                $order->save();
            }

            DB::commit();

            return back()->with('success', 'Payment of ₱' . number_format($validated['amount'], 2) . ' recorded successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function sendReminder(Customer $customer)
    {
        if ($customer->current_balance <= 0) {
            return back()->withErrors(['error' => 'Customer has no outstanding balance']);
        }

        if (!$customer->phone) {
            return back()->withErrors(['error' => 'Customer has no phone number']);
        }

        $sms = $this->smsService->sendCreditReminder($customer);

        if ($sms && $sms->status === 'sent') {
            return back()->with('success', 'Reminder sent successfully');
        }

        return back()->withErrors(['error' => 'Failed to send reminder']);
    }

    public function sendBulkReminders(Request $request)
    {
        $validated = $request->validate([
            'min_balance' => 'nullable|numeric|min:0',
            'min_days_overdue' => 'nullable|integer|min:1',
        ]);

        $query = Customer::where('current_balance', '>', 0)
            ->whereNotNull('phone');

        if (!empty($validated['min_balance'])) {
            $query->where('current_balance', '>=', $validated['min_balance']);
        }

        if (!empty($validated['min_days_overdue'])) {
            $query->whereDate('last_credit_date', '<=', now()->subDays($validated['min_days_overdue']));
        }

        $customers = $query->get();
        $sent = 0;
        $failed = 0;

        foreach ($customers as $customer) {
            try {
                $sms = $this->smsService->sendCreditReminder($customer);
                if ($sms && $sms->status === 'sent') {
                    $sent++;
                } else {
                    $failed++;
                }
            } catch (\Exception $e) {
                $failed++;
            }
        }

        return back()->with('success', "Sent {$sent} reminders. {$failed} failed.");
    }

    public function creditReport(Request $request)
    {
        $customersWithCredit = Customer::where('current_balance', '>', 0)
            ->orderByDesc('current_balance')
            ->get();

        $overdueCustomers = Customer::where('current_balance', '>', 0)
            ->whereDate('last_credit_date', '<=', now()->subDays(30))
            ->orderByDesc('current_balance')
            ->get();

        $stats = [
            'total_credit' => Customer::sum('current_balance'),
            'total_customers_with_credit' => Customer::where('current_balance', '>', 0)->count(),
            'overdue_30_days' => $overdueCustomers->sum('current_balance'),
            'overdue_count' => $overdueCustomers->count(),
        ];

        return Inertia::render('Customers/CreditReport', [
            'customersWithCredit' => $customersWithCredit,
            'overdueCustomers' => $overdueCustomers,
            'stats' => $stats,
        ]);
    }

    public function adjustCredit(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric',
            'type' => 'required|in:add,subtract',
            'reason' => 'required|string|max:255',
        ]);

        $amount = $validated['type'] === 'subtract' ? -abs($validated['amount']) : abs($validated['amount']);

        $balanceBefore = $customer->current_balance;
        $customer->current_balance = max(0, $customer->current_balance + $amount);
        $customer->save();

        CreditTransaction::create([
            'tenant_id' => tenant()->id,
            'customer_id' => $customer->id,
            'user_id' => auth()->id(),
            'type' => $amount > 0 ? 'credit' : 'adjustment',
            'amount' => abs($amount),
            'balance_before' => $balanceBefore,
            'balance_after' => $customer->current_balance,
            'description' => $validated['reason'],
        ]);

        return back()->with('success', 'Credit adjusted successfully');
    }
}
