<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Product;
use App\Models\DailyReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $tenant = tenant();
        $today = now()->startOfDay();
        $startOfWeek = now()->startOfWeek();
        $startOfMonth = now()->startOfMonth();

        // Today's stats
        $todayStats = [
            'orders' => Order::whereDate('created_at', $today)->count(),
            'revenue' => Order::whereDate('created_at', $today)
                ->where('payment_status', 'paid')
                ->sum('total'),
            'customers' => Customer::whereDate('created_at', $today)->count(),
        ];

        // This week's stats
        $weekStats = [
            'orders' => Order::where('created_at', '>=', $startOfWeek)->count(),
            'revenue' => Order::where('created_at', '>=', $startOfWeek)
                ->where('payment_status', 'paid')
                ->sum('total'),
        ];

        // This month's stats
        $monthStats = [
            'orders' => Order::where('created_at', '>=', $startOfMonth)->count(),
            'revenue' => Order::where('created_at', '>=', $startOfMonth)
                ->where('payment_status', 'paid')
                ->sum('total'),
            'average_order' => Order::where('created_at', '>=', $startOfMonth)
                ->where('payment_status', 'paid')
                ->avg('total') ?? 0,
        ];

        // Recent orders
        $recentOrders = Order::with(['customer', 'items'])
            ->latest()
            ->take(10)
            ->get();

        // Chart data - last 7 days
        $chartData = collect(range(6, 0))->map(function ($daysAgo) {
            $date = now()->subDays($daysAgo)->startOfDay();
            return [
                'date' => $date->format('M j'),
                'revenue' => Order::whereDate('created_at', $date)
                    ->where('payment_status', 'paid')
                    ->sum('total'),
                'orders' => Order::whereDate('created_at', $date)->count(),
            ];
        });

        // Low stock products (universal for all businesses)
        $lowStockProducts = Product::whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->where('is_active', true)
            ->where('track_inventory', true)
            ->take(5)
            ->get(['id', 'name', 'stock_quantity', 'low_stock_threshold']);

        // Customers with credit (utang)
        $customersWithCredit = Customer::where('current_balance', '>', 0)
            ->orderByDesc('current_balance')
            ->take(5)
            ->get(['id', 'name', 'current_balance', 'last_credit_date']);

        $totalCredit = Customer::where('current_balance', '>', 0)->sum('current_balance');

        return Inertia::render('Dashboard/Index', [
            'tenant' => $tenant,
            'todayStats' => $todayStats,
            'weekStats' => $weekStats,
            'monthStats' => $monthStats,
            'recentOrders' => $recentOrders,
            'chartData' => $chartData,
            'lowStockProducts' => $lowStockProducts,
            'customersWithCredit' => $customersWithCredit,
            'totalCredit' => $totalCredit,
        ]);
    }

    public function reports(Request $request)
    {
        $period = $request->get('period', 'today');
        $startDate = match ($period) {
            'today' => now()->startOfDay(),
            'yesterday' => now()->subDay()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'year' => now()->startOfYear(),
            'custom' => Carbon::parse($request->get('start_date')),
            default => now()->startOfDay(),
        };

        $endDate = match ($period) {
            'today' => now()->endOfDay(),
            'yesterday' => now()->subDay()->endOfDay(),
            'week' => now()->endOfWeek()->endOfDay(),
            'month' => now()->endOfMonth()->endOfDay(),
            'year' => now()->endOfYear()->endOfDay(),
            'custom' => Carbon::parse($request->get('end_date'))->endOfDay(),
            default => now()->endOfDay(),
        };

        // Sales summary
        $salesSummary = [
            'total_orders' => Order::whereBetween('created_at', [$startDate, $endDate])->count(),
            'gross_sales' => Order::whereBetween('created_at', [$startDate, $endDate])->sum('subtotal'),
            'discounts' => Order::whereBetween('created_at', [$startDate, $endDate])->sum('discount_amount'),
            'taxes' => Order::whereBetween('created_at', [$startDate, $endDate])->sum('tax_amount'),
            'net_sales' => Order::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->sum('total'),
        ];

        // Payment breakdown
        $paymentBreakdown = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('payment_status', 'paid')
            ->selectRaw('payment_method, COUNT(*) as count, SUM(total) as total')
            ->groupBy('payment_method')
            ->get();

        // Top products
        $topProducts = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.tenant_id', tenant()->id)
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->selectRaw('order_items.name, SUM(order_items.quantity) as quantity_sold, SUM(order_items.total) as revenue')
            ->groupBy('order_items.name')
            ->orderByDesc('revenue')
            ->take(10)
            ->get();

        // Credit summary
        $creditSummary = [
            'total_credit_sales' => Order::whereBetween('created_at', [$startDate, $endDate])
                ->where('is_credit', true)
                ->sum('total'),
            'credit_collected' => DB::table('credit_transactions')
                ->where('tenant_id', tenant()->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->where('type', 'payment')
                ->sum('amount'),
            'outstanding_balance' => Customer::sum('current_balance'),
        ];

        return Inertia::render('Dashboard/Reports', [
            'period' => $period,
            'startDate' => $startDate->toDateString(),
            'endDate' => $endDate->toDateString(),
            'salesSummary' => $salesSummary,
            'paymentBreakdown' => $paymentBreakdown,
            'topProducts' => $topProducts,
            'creditSummary' => $creditSummary,
        ]);
    }
}
