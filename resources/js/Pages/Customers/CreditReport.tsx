import React from 'react';
import { Head, Link } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, Customer } from '@/types';
import {
    ArrowLeftIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    ExclamationTriangleIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

interface CreditReportProps extends PageProps {
    customersWithCredit: Customer[];
    overdueCustomers: Customer[];
    stats: {
        total_credit: number;
        total_customers_with_credit: number;
        overdue_30_days: number;
        overdue_count: number;
    };
}

const formatCurrency = (amount: number | string | undefined | null): string => {
    const num = Number(amount) || 0;
    return '₱' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

export default function CreditReport({ customersWithCredit, overdueCustomers, stats }: CreditReportProps) {
    return (
        <TenantLayout title="Credit Report">
            <Head title="Credit Report" />

            {/* Back link */}
            <div className="mb-6">
                <Link href="/customers" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to Customers
                </Link>
            </div>

            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Credit Report (Utang)</h2>
                <p className="text-gray-600 mt-1">Overview of all outstanding customer credits.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <CurrencyDollarIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Outstanding</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.total_credit)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <UserGroupIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Customers with Credit</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total_customers_with_credit}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                            <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Overdue (30+ days)</p>
                            <p className="text-2xl font-bold text-amber-600">{formatCurrency(stats.overdue_30_days)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <ClockIcon className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Overdue Customers</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.overdue_count}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overdue Customers Section */}
            {overdueCustomers.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-200 bg-red-50 rounded-t-xl">
                        <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                            <ExclamationTriangleIcon className="h-5 w-5" />
                            Overdue Credits (30+ Days)
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Credit Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {overdueCustomers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link href={`/customers/${customer.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                                                {customer.name}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {customer.phone || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {customer.last_credit_date
                                                ? new Date(customer.last_credit_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
                                                : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="font-semibold text-red-600">{formatCurrency(customer.current_balance)}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Link href={`/customers/${customer.id}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* All Customers with Credit */}
            <div className="bg-white rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">All Customers with Credit</h3>
                </div>
                {customersWithCredit.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No outstanding credits</h3>
                        <p className="mt-1 text-sm text-gray-500">All customers are fully paid up.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Limit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Credit</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Payment</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {customersWithCredit.map((customer) => {
                                    const isOverLimit = customer.credit_limit > 0 && customer.current_balance > customer.credit_limit;
                                    return (
                                        <tr key={customer.id} className={`hover:bg-gray-50 ${isOverLimit ? 'bg-red-50' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Link href={`/customers/${customer.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                                                    {customer.name}
                                                </Link>
                                                {isOverLimit && (
                                                    <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                                        Over limit
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {customer.phone || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {customer.credit_limit > 0 ? formatCurrency(customer.credit_limit) : 'No limit'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {customer.last_credit_date
                                                    ? new Date(customer.last_credit_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {customer.last_payment_date
                                                    ? new Date(customer.last_payment_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="font-semibold text-red-600">{formatCurrency(customer.current_balance)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <Link href={`/customers/${customer.id}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </TenantLayout>
    );
}
