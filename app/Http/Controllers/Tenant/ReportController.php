<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Customer;
use App\Models\CreditTransaction;
use App\Exports\SalesReportExport;
use App\Exports\InventoryReportExport;
use App\Exports\CustomersReportExport;
use App\Exports\CreditsReportExport;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function sales(Request $request)
    {
        $period = $request->get('period', 'today');
        [$startDate, $endDate] = $this->getDateRange($period, $request);

        // Sales summary
        $salesSummary = [
            'total_orders' => Order::whereBetween('created_at', [$startDate, $endDate])->count(),
            'gross_sales' => Order::whereBetween('created_at', [$startDate, $endDate])->sum('subtotal'),
            'discounts' => Order::whereBetween('created_at', [$startDate, $endDate])->sum('discount_amount'),
            'taxes' => Order::whereBetween('created_at', [$startDate, $endDate])->sum('tax_amount'),
            'net_sales' => Order::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->sum('total'),
            'credit_sales' => Order::whereBetween('created_at', [$startDate, $endDate])
                ->where('is_credit', true)
                ->sum('total'),
        ];

        // Payment breakdown
        $paymentBreakdown = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('payment_status', 'paid')
            ->selectRaw('payment_method, COUNT(*) as count, SUM(total) as total')
            ->groupBy('payment_method')
            ->get();

        // Sales by type
        $salesByType = Order::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('type, COUNT(*) as count, SUM(total) as total')
            ->groupBy('type')
            ->get();

        // Top products
        $topProducts = \DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.tenant_id', tenant()->id)
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->selectRaw('order_items.name, SUM(order_items.quantity) as quantity_sold, SUM(order_items.total) as revenue')
            ->groupBy('order_items.name')
            ->orderByDesc('revenue')
            ->take(10)
            ->get();

        // Daily chart
        $dailyData = Order::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as orders, SUM(total) as revenue')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return Inertia::render('Reports/Sales', [
            'period' => $period,
            'startDate' => $startDate->toDateString(),
            'endDate' => $endDate->toDateString(),
            'salesSummary' => $salesSummary,
            'paymentBreakdown' => $paymentBreakdown,
            'salesByType' => $salesByType,
            'topProducts' => $topProducts,
            'dailyData' => $dailyData,
        ]);
    }

    public function inventory(Request $request)
    {
        $products = Product::with('category')
            ->orderBy('name')
            ->get();

        $summary = [
            'total_products' => $products->count(),
            'total_value' => $products->sum(fn($p) => $p->cost_price * $p->stock_quantity),
            'low_stock' => $products->filter(fn($p) => $p->isLowStock())->count(),
            'out_of_stock' => $products->filter(fn($p) => $p->isOutOfStock())->count(),
        ];

        // Movement summary for period
        $period = $request->get('period', 'month');
        [$startDate, $endDate] = $this->getDateRange($period, $request);

        $movements = \DB::table('stock_movements')
            ->where('tenant_id', tenant()->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('type, SUM(ABS(quantity)) as total_quantity')
            ->groupBy('type')
            ->get();

        return Inertia::render('Reports/Inventory', [
            'products' => $products,
            'summary' => $summary,
            'movements' => $movements,
            'period' => $period,
        ]);
    }

    public function customers(Request $request)
    {
        $period = $request->get('period', 'month');
        [$startDate, $endDate] = $this->getDateRange($period, $request);

        // Customer summary
        $summary = [
            'total_customers' => Customer::count(),
            'new_customers' => Customer::whereBetween('created_at', [$startDate, $endDate])->count(),
            'suki_customers' => Customer::where('is_suki', true)->count(),
            'with_credit' => Customer::where('current_balance', '>', 0)->count(),
        ];

        // Top customers by spending
        $topCustomers = Customer::withSum([
            'orders' => function ($query) use ($startDate, $endDate) {
                $query->whereBetween('created_at', [$startDate, $endDate]);
            }
        ], 'total')
            ->orderByDesc('orders_sum_total')
            ->take(10)
            ->get();

        // Customer acquisition chart
        $acquisitionData = Customer::whereBetween('created_at', [$startDate, $endDate])
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return Inertia::render('Reports/Customers', [
            'summary' => $summary,
            'topCustomers' => $topCustomers,
            'acquisitionData' => $acquisitionData,
            'period' => $period,
        ]);
    }

    public function credits(Request $request)
    {
        $period = $request->get('period', 'month');
        [$startDate, $endDate] = $this->getDateRange($period, $request);

        // Credit summary
        $summary = [
            'total_outstanding' => Customer::sum('current_balance'),
            'customers_with_credit' => Customer::where('current_balance', '>', 0)->count(),
            'credit_given' => CreditTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->where('type', 'credit')
                ->sum('amount'),
            'payments_received' => CreditTransaction::whereBetween('created_at', [$startDate, $endDate])
                ->where('type', 'payment')
                ->sum('amount'),
        ];

        // Overdue by age
        $overdueByAge = [
            '1-7 days' => Customer::where('current_balance', '>', 0)
                ->whereDate('last_credit_date', '>=', now()->subDays(7))
                ->whereDate('last_credit_date', '<', now())
                ->sum('current_balance'),
            '8-14 days' => Customer::where('current_balance', '>', 0)
                ->whereDate('last_credit_date', '>=', now()->subDays(14))
                ->whereDate('last_credit_date', '<', now()->subDays(7))
                ->sum('current_balance'),
            '15-30 days' => Customer::where('current_balance', '>', 0)
                ->whereDate('last_credit_date', '>=', now()->subDays(30))
                ->whereDate('last_credit_date', '<', now()->subDays(14))
                ->sum('current_balance'),
            '30+ days' => Customer::where('current_balance', '>', 0)
                ->whereDate('last_credit_date', '<', now()->subDays(30))
                ->sum('current_balance'),
        ];

        // Customers with credit
        $customersWithCredit = Customer::where('current_balance', '>', 0)
            ->orderByDesc('current_balance')
            ->get();

        return Inertia::render('Reports/Credits', [
            'summary' => $summary,
            'overdueByAge' => $overdueByAge,
            'customersWithCredit' => $customersWithCredit,
            'period' => $period,
        ]);
    }

    public function export(Request $request, string $type)
    {
        $period = $request->get('period', 'month');
        [$startDate, $endDate] = $this->getDateRange($period, $request);

        $periodLabel = match ($period) {
            'today' => 'daily',
            'yesterday' => 'yesterday',
            'week' => 'weekly',
            'month' => 'monthly',
            'quarter' => 'quarterly',
            'year' => 'annually',
            'custom' => $startDate->format('M d') . '-to-' . $endDate->format('M d, Y'),
            default => 'monthly',
        };

        $filename = "{$type}-report-{$periodLabel}-" . now()->format('Y-m-d') . ".xlsx";

        return match ($type) {
            'sales' => $this->exportSales($startDate, $endDate, $filename),
            'inventory' => $this->exportInventory($startDate, $endDate, $filename),
            'customers' => $this->exportCustomers($startDate, $endDate, $filename),
            'credits' => $this->exportCredits($startDate, $endDate, $filename),
            default => back()->withErrors(['error' => 'Invalid export type']),
        };
    }

    protected function getDateRange(string $period, Request $request): array
    {
        return match ($period) {
            'today' => [now()->startOfDay(), now()->endOfDay()],
            'yesterday' => [now()->subDay()->startOfDay(), now()->subDay()->endOfDay()],
            'week' => [now()->startOfWeek(), now()->endOfWeek()],
            'month' => [now()->startOfMonth(), now()->endOfMonth()],
            'quarter' => [now()->startOfQuarter(), now()->endOfQuarter()],
            'year' => [now()->startOfYear(), now()->endOfYear()],
            'custom' => [
                Carbon::parse($request->get('start_date', now()->startOfMonth())),
                Carbon::parse($request->get('end_date', now()))->endOfDay(),
            ],
            default => [now()->startOfMonth(), now()->endOfMonth()],
        };
    }

    protected function exportSales($startDate, $endDate, $filename)
    {
        return Excel::download(
            new SalesReportExport($startDate, $endDate),
            $filename
        );
    }

    protected function exportInventory($startDate, $endDate, $filename)
    {
        return Excel::download(
            new InventoryReportExport($startDate, $endDate),
            $filename
        );
    }

    protected function exportCustomers($startDate, $endDate, $filename)
    {
        return Excel::download(
            new CustomersReportExport($startDate, $endDate),
            $filename
        );
    }

    protected function exportCredits($startDate, $endDate, $filename)
    {
        return Excel::download(
            new CreditsReportExport($startDate, $endDate),
            $filename
        );
    }
}
