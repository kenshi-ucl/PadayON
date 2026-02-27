import React from 'react';
import { Head } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, Tenant, Order, Product, Customer } from '@/types';
import {
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// Dashboard stat card icons
import revenueIcon from '@/../images/dashboard/revenue.png';
import ordersIcon from '@/../images/dashboard/orders.png';
import customersIcon from '@/../images/dashboard/customers.png';
import warningIcon from '@/../images/dashboard/warning.png';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface DashboardProps extends PageProps {
    tenant: Tenant;
    todayStats: {
        orders: number;
        revenue: number;
        customers: number;
    };
    weekStats: {
        orders: number;
        revenue: number;
    };
    monthStats: {
        orders: number;
        revenue: number;
        average_order: number;
    };
    recentOrders: Order[];
    chartData: Array<{ date: string; revenue: number; orders: number }>;
    lowStockProducts: Product[];
    customersWithCredit: Customer[];
    totalCredit: number;
}

export default function Dashboard({
    tenant,
    todayStats,
    weekStats,
    monthStats,
    recentOrders,
    chartData,
    lowStockProducts,
    customersWithCredit,
    totalCredit,
}: DashboardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const lineChartData = {
        labels: chartData.map((d) => d.date),
        datasets: [
            {
                label: 'Revenue',
                data: chartData.map((d) => d.revenue),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value: string | number) => '₱' + Number(value).toLocaleString(),
                },
            },
        },
    };

    const stats = [
        {
            name: "Today's Revenue",
            value: formatCurrency(todayStats.revenue),
            icon: revenueIcon,
            change: '+12%',
            changeType: 'positive',
        },
        {
            name: "Today's Orders",
            value: todayStats.orders.toString(),
            icon: ordersIcon,
            change: '+5%',
            changeType: 'positive',
        },
        {
            name: 'New Customers',
            value: todayStats.customers.toString(),
            icon: customersIcon,
            change: '+2',
            changeType: 'positive',
        },
        {
            name: 'Outstanding Credit',
            value: formatCurrency(totalCredit),
            icon: warningIcon,
            change: customersWithCredit.length + ' customers',
            changeType: 'neutral',
        },
    ];

    return (
        <TenantLayout title="Dashboard">
            <Head title="Dashboard" />

            {/* Welcome message */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    Magandang araw, {tenant.business_name || tenant.name}! 👋
                </h2>
                <p className="text-gray-600 mt-1">
                    Here's what's happening with your business today.
                </p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className="relative overflow-hidden rounded-xl bg-white px-4 py-5 shadow sm:px-6"
                    >
                        <dt>
                            <div className="absolute">
                                <img src={stat.icon} alt={stat.name} className="h-10 w-10 object-contain" aria-hidden="true" />
                            </div>
                            <p className="ml-14 truncate text-sm font-medium text-gray-500">
                                {stat.name}
                            </p>
                        </dt>
                        <dd className="ml-14 flex items-baseline">
                            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                            <p
                                className={`ml-2 flex items-baseline text-sm font-semibold ${stat.changeType === 'positive'
                                    ? 'text-green-600'
                                    : stat.changeType === 'negative'
                                        ? 'text-red-600'
                                        : 'text-gray-500'
                                    }`}
                            >
                                {stat.change}
                            </p>
                        </dd>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Revenue (Last 7 Days)
                    </h3>
                    <div className="h-64">
                        <Line data={lineChartData} options={chartOptions} />
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Orders</span>
                            <span className="font-semibold">{monthStats.orders}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Revenue</span>
                            <span className="font-semibold">{formatCurrency(monthStats.revenue)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Avg. Order Value</span>
                            <span className="font-semibold">{formatCurrency(monthStats.average_order)}</span>
                        </div>
                        <hr />
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">This Week Orders</span>
                            <span className="font-semibold">{weekStats.orders}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">This Week Revenue</span>
                            <span className="font-semibold">{formatCurrency(weekStats.revenue)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Recent Orders */}
                <div className="bg-white rounded-xl shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {recentOrders.length === 0 ? (
                            <p className="px-6 py-4 text-gray-500 text-sm">No orders yet today</p>
                        ) : (
                            recentOrders.slice(0, 5).map((order) => (
                                <div key={order.id} className="px-6 py-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-gray-900">{order.order_number}</p>
                                        <p className="text-sm text-gray-500">
                                            {order.customer?.name || order.customer_name || 'Walk-in'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">
                                            {formatCurrency(order.total)}
                                        </p>
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${order.payment_status === 'paid'
                                                ? 'bg-green-100 text-green-700'
                                                : order.payment_status === 'partial'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-red-100 text-red-700'
                                                }`}
                                        >
                                            {order.payment_status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200">
                        <a href="/orders" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            View all orders →
                        </a>
                    </div>
                </div>

                {/* Customers with Credit (Utang) */}
                <div className="bg-white rounded-xl shadow">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">Outstanding Credit (Utang)</h3>
                        <span className="text-lg font-bold text-red-600">{formatCurrency(totalCredit)}</span>
                    </div>
                    <div className="divide-y divide-gray-200">
                        {customersWithCredit.length === 0 ? (
                            <p className="px-6 py-4 text-gray-500 text-sm">No outstanding credit</p>
                        ) : (
                            customersWithCredit.map((customer) => (
                                <div key={customer.id} className="px-6 py-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-gray-900">{customer.name}</p>
                                        <p className="text-sm text-gray-500">
                                            Since {customer.last_credit_date ? new Date(customer.last_credit_date).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-red-600">
                                            {formatCurrency(customer.current_balance)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200">
                        <a href="/customers/credit-report" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            View credit report →
                        </a>
                    </div>
                </div>

                {/* Low Stock Alert */}
                {lowStockProducts.length > 0 && (
                    <div className="bg-white rounded-xl shadow">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                                Low Stock Alert
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {lowStockProducts.map((product) => (
                                <div key={product.id} className="px-6 py-4 flex justify-between items-center">
                                    <p className="font-medium text-gray-900">{product.name}</p>
                                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                        {product.stock_quantity} left
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200">
                            <a href="/products/low-stock" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                View all low stock →
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </TenantLayout>
    );
}
