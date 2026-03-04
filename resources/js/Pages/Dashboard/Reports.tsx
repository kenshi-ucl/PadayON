import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps } from '@/types';
import {
    ChartBarIcon,
    CurrencyDollarIcon,
    ShoppingCartIcon,
    CreditCardIcon,
    CalendarIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    ArrowDownTrayIcon,
    PrinterIcon,
    BanknotesIcon,
    DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface ReportsProps extends PageProps {
    period: string;
    startDate: string;
    endDate: string;
    salesSummary: {
        total_orders: number;
        gross_sales: number | string;
        discounts: number | string;
        taxes: number | string;
        net_sales: number | string;
    };
    paymentBreakdown: Array<{
        payment_method: string;
        count: number;
        total: number | string;
    }>;
    topProducts: Array<{
        name: string;
        quantity_sold: number;
        revenue: number | string;
    }>;
    creditSummary: {
        total_credit_sales: number | string;
        credit_collected: number | string;
        outstanding_balance: number | string;
    };
}

const formatCurrency = (amount: number | string | null | undefined): string => {
    const num = Number(amount) || 0;
    return '₱' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

export default function Reports({
    period,
    startDate,
    endDate,
    salesSummary,
    paymentBreakdown,
    topProducts,
    creditSummary,
}: ReportsProps) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);
    const [customStart, setCustomStart] = useState(startDate);
    const [customEnd, setCustomEnd] = useState(endDate);

    // Keep state in sync with server props after Inertia visits
    useEffect(() => {
        setSelectedPeriod(period);
    }, [period]);
    useEffect(() => {
        setCustomStart(startDate);
    }, [startDate]);
    useEffect(() => {
        setCustomEnd(endDate);
    }, [endDate]);

    const handlePeriodChange = (newPeriod: string) => {
        setSelectedPeriod(newPeriod);
        if (newPeriod !== 'custom') {
            router.get('/reports', { period: newPeriod }, { preserveState: true });
        }
    };

    const handleCustomDate = () => {
        router.get('/reports', {
            period: 'custom',
            start_date: customStart,
            end_date: customEnd,
        }, { preserveState: true });
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

    const periods = [
        { value: 'today', label: 'Daily (Today)' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'week', label: 'Weekly' },
        { value: 'month', label: 'Monthly' },
        { value: 'year', label: 'Annually' },
        { value: 'custom', label: 'Custom Range' },
    ];

    const getPaymentMethodIcon = (method: string) => {
        switch (method?.toLowerCase()) {
            case 'cash':
                return <BanknotesIcon className="h-5 w-5" />;
            case 'gcash':
            case 'maya':
                return <CreditCardIcon className="h-5 w-5" />;
            case 'card':
                return <CreditCardIcon className="h-5 w-5" />;
            default:
                return <CurrencyDollarIcon className="h-5 w-5" />;
        }
    };

    const getPaymentMethodColor = (method: string) => {
        switch (method?.toLowerCase()) {
            case 'cash':
                return 'bg-green-100 text-green-700';
            case 'gcash':
                return 'bg-blue-100 text-blue-700';
            case 'maya':
                return 'bg-purple-100 text-purple-700';
            case 'card':
                return 'bg-orange-100 text-orange-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
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
                    <p className="text-gray-500">
                        {formatDate(startDate)} - {formatDate(endDate)}
                    </p>
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
                                    <ShoppingCartIcon className="h-4 w-4 text-blue-600" />
                                    Inventory Report
                                </a>
                                <a href={buildExportUrl('customers')} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <CreditCardIcon className="h-4 w-4 text-purple-600" />
                                    Customers Report
                                </a>
                                <a href={buildExportUrl('credits')} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <BanknotesIcon className="h-4 w-4 text-red-600" />
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
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex flex-wrap items-end gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="px-4 py-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="px-4 py-2 border rounded-lg"
                            />
                        </div>
                        <button
                            onClick={handleCustomDate}
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}

            {/* Sales Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Orders</p>
                            <p className="text-3xl font-bold text-gray-900">{salesSummary.total_orders}</p>
                        </div>
                        <div className="p-3 bg-primary-100 rounded-xl">
                            <ShoppingCartIcon className="h-6 w-6 text-primary-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Gross Sales</p>
                            <p className="text-3xl font-bold text-gray-900">{formatCurrency(salesSummary.gross_sales)}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-xl">
                            <span className="h-6 w-6 text-green-600 font-bold text-lg flex items-center justify-center">₱</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Discounts</p>
                            <p className="text-3xl font-bold text-red-600">-{formatCurrency(salesSummary.discounts)}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-xl">
                            <ArrowTrendingDownIcon className="h-6 w-6 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Net Sales</p>
                            <p className="text-3xl font-bold text-green-600">{formatCurrency(salesSummary.net_sales)}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-xl">
                            <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Payment Breakdown */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCardIcon className="h-5 w-5 text-primary-600" />
                        Payment Breakdown
                    </h2>
                    {paymentBreakdown.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No payment data for this period</p>
                    ) : (
                        <div className="space-y-4">
                            {paymentBreakdown.map((payment, index) => (
                                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className={clsx('p-2 rounded-lg', getPaymentMethodColor(payment.payment_method))}>
                                            {getPaymentMethodIcon(payment.payment_method)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 capitalize">
                                                {payment.payment_method || 'Unknown'}
                                            </p>
                                            <p className="text-sm text-gray-500">{payment.count} transactions</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold text-gray-900">{formatCurrency(payment.total)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Credit Summary */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <BanknotesIcon className="h-5 w-5 text-primary-600" />
                        Credit (Utang) Summary
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                            <div>
                                <p className="text-sm text-yellow-700">Credit Sales This Period</p>
                                <p className="text-2xl font-bold text-yellow-800">
                                    {formatCurrency(creditSummary.total_credit_sales)}
                                </p>
                            </div>
                            <ArrowTrendingUpIcon className="h-8 w-8 text-yellow-600" />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-200">
                            <div>
                                <p className="text-sm text-green-700">Credit Collected This Period</p>
                                <p className="text-2xl font-bold text-green-800">
                                    {formatCurrency(creditSummary.credit_collected)}
                                </p>
                            </div>
                            <ArrowTrendingDownIcon className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-red-50 border border-red-200">
                            <div>
                                <p className="text-sm text-red-700">Total Outstanding Balance</p>
                                <p className="text-2xl font-bold text-red-800">
                                    {formatCurrency(creditSummary.outstanding_balance)}
                                </p>
                            </div>
                            <CurrencyDollarIcon className="h-8 w-8 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ChartBarIcon className="h-5 w-5 text-primary-600" />
                    Top Selling Products
                </h2>
                {topProducts.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No product data for this period</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rank</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Product</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Qty Sold</th>
                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProducts.map((product, index) => (
                                    <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <span className={clsx(
                                                'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                                                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    index === 1 ? 'bg-gray-200 text-gray-700' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-gray-100 text-gray-600'
                                            )}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-medium text-gray-900">{product.name}</td>
                                        <td className="py-3 px-4 text-right text-gray-600">{product.quantity_sold}</td>
                                        <td className="py-3 px-4 text-right font-bold text-green-600">
                                            {formatCurrency(product.revenue)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </TenantLayout>
    );
}
