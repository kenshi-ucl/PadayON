<?php

namespace App\Console\Commands;

use App\Models\DailyReport;
use App\Models\Order;
use App\Models\Customer;
use App\Models\Tenant;
use App\Models\Payment;
use App\Models\EloadTransaction;
use App\Models\BillsPayment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Stancl\Tenancy\Facades\Tenancy;
use Carbon\Carbon;

class GenerateDailyReports extends Command
{
    protected $signature = 'padayon:generate-daily-reports {--date= : Date to generate report for (Y-m-d)}';

    protected $description = 'Generate daily reports for all tenants';

    public function handle()
    {
        $date = $this->option('date')
            ? Carbon::parse($this->option('date'))
            : Carbon::yesterday();

        $this->info("Generating reports for {$date->toDateString()}");

        $tenants = Tenant::where('is_active', true)->get();
        $generated = 0;

        foreach ($tenants as $tenant) {
            Tenancy::initialize($tenant);

            try {
                $this->generateReport($tenant, $date);
                $generated++;
                $this->info("Generated report for {$tenant->name}");
            } catch (\Exception $e) {
                $this->error("Failed for {$tenant->name}: {$e->getMessage()}");
            }

            Tenancy::end();
        }

        $this->info("Completed: {$generated} reports generated");
        return 0;
    }

    protected function generateReport(Tenant $tenant, Carbon $date)
    {
        // Delete existing report for this date
        DailyReport::where('tenant_id', $tenant->id)
            ->where('report_date', $date->toDateString())
            ->delete();

        // Get orders for the day
        $orders = Order::whereDate('created_at', $date);

        // Calculate metrics
        $totalOrders = $orders->count();
        $grossSales = $orders->sum('subtotal');
        $discounts = $orders->sum('discount_amount');
        $taxes = $orders->sum('tax_amount');
        $netSales = $orders->where('payment_status', 'paid')->sum('total');

        // Payment breakdown
        $payments = Payment::whereDate('created_at', $date)->where('status', 'completed');
        $cashCollected = $payments->clone()->where('method', 'cash')->sum('amount');
        $gcashCollected = $payments->clone()->where('method', 'gcash')->sum('amount');
        $mayaCollected = $payments->clone()->where('method', 'maya')->sum('amount');
        $cardCollected = $payments->clone()->where('method', 'card')->sum('amount');

        // Credit sales
        $creditSales = Order::whereDate('created_at', $date)
            ->where('is_credit', true)
            ->sum('total');

        $creditCollected = DB::table('credit_transactions')
            ->where('tenant_id', $tenant->id)
            ->whereDate('created_at', $date)
            ->where('type', 'payment')
            ->sum('amount');

        // E-loading
        $eloadTransactions = EloadTransaction::whereDate('created_at', $date)
            ->where('status', 'completed');
        $eloadSales = $eloadTransactions->sum('amount');
        $eloadProfit = $eloadTransactions->sum('profit');

        // Bills payment
        $billsPayments = BillsPayment::whereDate('created_at', $date)
            ->where('status', 'completed');
        $billsAmount = $billsPayments->sum('amount');

        // Items sold
        $itemsSold = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.tenant_id', $tenant->id)
            ->whereDate('orders.created_at', $date)
            ->sum('order_items.quantity');

        $costOfGoods = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.tenant_id', $tenant->id)
            ->whereDate('orders.created_at', $date)
            ->selectRaw('SUM(order_items.cost_price * order_items.quantity) as total')
            ->value('total') ?? 0;

        // Customers
        $newCustomers = Customer::whereDate('created_at', $date)->count();
        $returningCustomers = Order::whereDate('created_at', $date)
            ->whereNotNull('customer_id')
            ->distinct('customer_id')
            ->count();

        // Business-specific metrics
        $laundryJobs = 0;
        $laundryWeight = 0;
        $cateringEvents = 0;
        $cateringGuests = 0;

        if ($tenant->business_type === 'laundry') {
            $laundryOrders = DB::table('laundry_orders')
                ->where('tenant_id', $tenant->id)
                ->whereDate('created_at', $date);
            $laundryJobs = $laundryOrders->count();
            $laundryWeight = $laundryOrders->sum('weight');
        }

        if ($tenant->business_type === 'catering') {
            $cateringEventsData = DB::table('catering_events')
                ->where('tenant_id', $tenant->id)
                ->whereDate('event_date', $date);
            $cateringEvents = $cateringEventsData->count();
            $cateringGuests = $cateringEventsData->sum('guest_count');
        }

        // Top products
        $topProducts = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.tenant_id', $tenant->id)
            ->whereDate('orders.created_at', $date)
            ->selectRaw('order_items.name, SUM(order_items.quantity) as quantity, SUM(order_items.total) as revenue')
            ->groupBy('order_items.name')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get()
            ->toArray();

        // Create report
        DailyReport::create([
            'tenant_id' => $tenant->id,
            'report_date' => $date->toDateString(),
            'total_orders' => $totalOrders,
            'gross_sales' => $grossSales,
            'discounts' => $discounts,
            'taxes' => $taxes,
            'net_sales' => $netSales,
            'cash_collected' => $cashCollected,
            'gcash_collected' => $gcashCollected,
            'maya_collected' => $mayaCollected,
            'card_collected' => $cardCollected,
            'credit_sales' => $creditSales,
            'credit_collected' => $creditCollected,
            'eload_transactions' => $eloadTransactions->count(),
            'eload_sales' => $eloadSales,
            'eload_profit' => $eloadProfit,
            'bills_transactions' => $billsPayments->count(),
            'bills_amount' => $billsAmount,
            'items_sold' => $itemsSold,
            'cost_of_goods' => $costOfGoods,
            'gross_profit' => $grossSales - $costOfGoods,
            'new_customers' => $newCustomers,
            'returning_customers' => $returningCustomers,
            'laundry_jobs' => $laundryJobs,
            'laundry_weight' => $laundryWeight,
            'catering_events' => $cateringEvents,
            'catering_guests' => $cateringGuests,
            'top_products' => $topProducts,
        ]);
    }
}
