import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps } from '@/types';
import {
    ChartBarIcon,
    CurrencyDollarIcon,
    ShoppingBagIcon,
    UsersIcon,
    CreditCardIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ArrowDownTrayIcon,
    PrinterIcon,
    DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface ReportStats {
    today: {
        sales: number;
        orders: number;
        customers: number;
        average_order: number;
    };
    week: {
        sales: number;
        orders: number;
        growth: number;
    };
    month: {
        sales: number;
        orders: number;
        growth: number;
    };
    topProducts: Array<{
        id: number;
        name: string;
        quantity_sold: number;
        revenue: number;
    }>;
    creditSummary: {
        total_outstanding: number;
        customers_with_credit: number;
        overdue_amount: number;
    };
}

interface ReportsIndexProps extends PageProps {
    stats: ReportStats;
    dateRange: {
        start: string;
        end: string;
    };
}

const formatCurrency = (amount: number): string => {
    return '₱' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

export default function ReportsIndex({ stats, dateRange }: ReportsIndexProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'sales' | 'inventory' | 'customers' | 'credits'>('overview');
    const [selectedPeriod, setSelectedPeriod] = useState('today');
    const [customStart, setCustomStart] = useState(dateRange?.start || '');
    const [customEnd, setCustomEnd] = useState(dateRange?.end || '');

    const defaultStats: ReportStats = stats || {
        today: { sales: 0, orders: 0, customers: 0, average_order: 0 },
        week: { sales: 0, orders: 0, growth: 0 },
        month: { sales: 0, orders: 0, growth: 0 },
        topProducts: [],
        creditSummary: { total_outstanding: 0, customers_with_credit: 0, overdue_amount: 0 },
    };

    const tabs = [
        { id: 'overview', name: 'Overview', icon: ChartBarIcon },
        { id: 'sales', name: 'Sales', icon: CurrencyDollarIcon },
        { id: 'inventory', name: 'Inventory', icon: ShoppingBagIcon },
        { id: 'customers', name: 'Customers', icon: UsersIcon },
        { id: 'credits', name: 'Credits', icon: CreditCardIcon },
    ];

    const periods = [
        { value: 'today', label: 'Daily (Today)' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'week', label: 'Weekly' },
        { value: 'month', label: 'Monthly' },
        { value: 'year', label: 'Annually' },
        { value: 'custom', label: 'Custom Range' },
    ];

    const handlePeriodChange = (newPeriod: string) => {
        setSelectedPeriod(newPeriod);
    };

    const buildExportUrl = (type: string): string => {
        const params = new URLSearchParams();
        params.set('period', selectedPeriod);
        if (selectedPeriod === 'custom') {
            params.set('start_date', customStart);
            params.set('end_date', customEnd);
        }
        return `/reports/export/${type}?${params.toString()}`;
    };

    const handlePrint = () => {
        window.print();
    };

    const getActiveExportType = (): string => {
        if (activeTab === 'overview' || activeTab === 'sales') return 'sales';
        return activeTab;
    };

    return (
        <TenantLayout title="Reports">
            <Head title="Reports" />

            {/* Print-only styles */}
            <style>{`
                @media print {
                    nav, aside, header, footer, button, .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    body { background: white !important; }
                    .shadow-sm { box-shadow: none !important; }
                    main { padding: 0 !important; margin: 0 !important; }
                }
            `}</style>

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <DocumentChartBarIcon className="h-7 w-7 text-primary-600" />
                        Reports & Analytics
                    </h1>
                    <p className="text-gray-500">Business insights and performance metrics</p>
                </div>
                <div className="flex items-center gap-3 no-print">
                    {/* Download Dropdown */}
                    <div className="relative group">
                        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm">
                            <ArrowDownTrayIcon className="h-5 w-5" />
                            Download Excel
                        </button>
                        <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                            <div className="py-2">
                                <a href={buildExportUrl('sales')} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                                    Sales Report
                                </a>
                                <a href={buildExportUrl('inventory')} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <ShoppingBagIcon className="h-4 w-4 text-blue-600" />
                                    Inventory Report
                                </a>
                                <a href={buildExportUrl('customers')} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <UsersIcon className="h-4 w-4 text-purple-600" />
                                    Customers Report
                                </a>
                                <a href={buildExportUrl('credits')} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <CreditCardIcon className="h-4 w-4 text-red-600" />
                                    Credits Report
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Print Button */}
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm"
                    >
                        <PrinterIcon className="h-5 w-5" />
                        Print
                    </button>
                </div>
            </div>

            {/* Period Filter */}
            <div className="flex gap-2 flex-wrap mb-6 no-print">
                {periods.map((p) => (
                    <button
                        key={p.value}
                        onClick={() => handlePeriodChange(p.value)}
                        className={clsx(
                            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                            selectedPeriod === p.value
                                ? 'bg-primary-600 text-white'
                                : 'bg-white text-gray-700 border hover:bg-gray-50'
                        )}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Custom Date Range */}
            {selectedPeriod === 'custom' && (
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6 no-print">
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b no-print">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={clsx(
                            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                            activeTab === tab.id
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        )}
                    >
                        <tab.icon className="h-5 w-5" />
                        {tab.name}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Today's Sales</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(defaultStats.today.sales)}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Today's Orders</p>
                                    <p className="text-2xl font-bold text-gray-900">{defaultStats.today.orders}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Customers Today</p>
                                    <p className="text-2xl font-bold text-gray-900">{defaultStats.today.customers}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <UsersIcon className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Avg. Order Value</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(defaultStats.today.average_order)}</p>
                                </div>
                                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <ChartBarIcon className="h-6 w-6 text-yellow-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Period Comparisons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Sales</span>
                                    <span className="font-semibold">{formatCurrency(defaultStats.week.sales)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Orders</span>
                                    <span className="font-semibold">{defaultStats.week.orders}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <span className="text-gray-600">Growth</span>
                                    <span className={clsx(
                                        'flex items-center gap-1',
                                        defaultStats.week.growth >= 0 ? 'text-green-600' : 'text-red-600'
                                    )}>
                                        {defaultStats.week.growth >= 0 ? (
                                            <ArrowTrendingUpIcon className="h-4 w-4" />
                                        ) : (
                                            <ArrowTrendingDownIcon className="h-4 w-4" />
                                        )}
                                        {Math.abs(defaultStats.week.growth)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Sales</span>
                                    <span className="font-semibold">{formatCurrency(defaultStats.month.sales)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Orders</span>
                                    <span className="font-semibold">{defaultStats.month.orders}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t">
                                    <span className="text-gray-600">Growth</span>
                                    <span className={clsx(
                                        'flex items-center gap-1',
                                        defaultStats.month.growth >= 0 ? 'text-green-600' : 'text-red-600'
                                    )}>
                                        {defaultStats.month.growth >= 0 ? (
                                            <ArrowTrendingUpIcon className="h-4 w-4" />
                                        ) : (
                                            <ArrowTrendingDownIcon className="h-4 w-4" />
                                        )}
                                        {Math.abs(defaultStats.month.growth)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 text-sm font-medium text-gray-500">Product</th>
                                    <th className="text-center py-2 text-sm font-medium text-gray-500">Qty Sold</th>
                                    <th className="text-right py-2 text-sm font-medium text-gray-500">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {defaultStats.topProducts.length > 0 ? (
                                    defaultStats.topProducts.map((product, index) => (
                                        <tr key={product.id} className="border-b">
                                            <td className="py-3">
                                                <span className="inline-flex items-center gap-2">
                                                    <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium">
                                                        {index + 1}
                                                    </span>
                                                    {product.name}
                                                </span>
                                            </td>
                                            <td className="py-3 text-center">{product.quantity_sold}</td>
                                            <td className="py-3 text-right font-medium">{formatCurrency(product.revenue)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-gray-500">
                                            No sales data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Credit Summary */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">Total Outstanding</p>
                                <p className="text-xl font-bold text-gray-900">{formatCurrency(defaultStats.creditSummary.total_outstanding)}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">Customers with Credit</p>
                                <p className="text-xl font-bold text-gray-900">{defaultStats.creditSummary.customers_with_credit}</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg">
                                <p className="text-sm text-red-600">Overdue Amount</p>
                                <p className="text-xl font-bold text-red-600">{formatCurrency(defaultStats.creditSummary.overdue_amount)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Download Section */}
                    <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-6 border border-primary-100">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Download Reports as Excel (.xlsx)</h3>
                        <p className="text-gray-600 text-sm mb-4">Select a period above and download detailed reports in Excel format</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <a
                                href={buildExportUrl('sales')}
                                className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-sm font-medium text-gray-700"
                            >
                                <ArrowDownTrayIcon className="h-4 w-4 text-green-600" />
                                Sales Report
                            </a>
                            <a
                                href={buildExportUrl('inventory')}
                                className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm font-medium text-gray-700"
                            >
                                <ArrowDownTrayIcon className="h-4 w-4 text-blue-600" />
                                Inventory Report
                            </a>
                            <a
                                href={buildExportUrl('customers')}
                                className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-sm font-medium text-gray-700"
                            >
                                <ArrowDownTrayIcon className="h-4 w-4 text-purple-600" />
                                Customers Report
                            </a>
                            <a
                                href={buildExportUrl('credits')}
                                className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors text-sm font-medium text-gray-700"
                            >
                                <ArrowDownTrayIcon className="h-4 w-4 text-red-600" />
                                Credits Report
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Other tabs - link to detailed report with download */}
            {activeTab !== 'overview' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{tabs.find(t => t.id === activeTab)?.name} Report</h3>
                        <p className="text-gray-500 mb-6">View detailed analytics or download as Excel file</p>
                        <div className="flex justify-center gap-3">
                            <Link
                                href={`/reports/${activeTab}`}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
                            >
                                View Detailed Report →
                            </Link>
                            <a
                                href={buildExportUrl(getActiveExportType())}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                            >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                                Download Excel
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
