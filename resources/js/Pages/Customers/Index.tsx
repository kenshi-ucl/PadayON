import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, Customer } from '@/types';
import {
    PlusIcon,
    MagnifyingGlassIcon,
    BellAlertIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    StarIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface CustomersIndexProps extends PageProps {
    customers: {
        data: Customer[];
        links: any;
    };
    stats: {
        total: number;
        with_credit: number;
        total_credit: number;
        suki: number;
    };
    filter: string;
    search: string;
}

const formatCurrency = (amount: number | string | undefined | null): string => {
    const num = Number(amount) || 0;
    return '₱' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

export default function CustomersIndex({ customers, stats, filter, search }: CustomersIndexProps) {
    const [searchQuery, setSearchQuery] = useState(search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/customers', { search: searchQuery, filter }, { preserveState: true });
    };

    return (
        <TenantLayout title="Customers">
            <Head title="Customers" />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <UserGroupIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Customers</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <CurrencyDollarIcon className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Utang</p>
                            <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.total_credit)}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                            <BellAlertIcon className="h-6 w-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">With Credit</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.with_credit}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <StarIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Suki Customers</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.suki}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <form onSubmit={handleSearch} className="flex-1 max-w-md">
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </form>

                <div className="flex gap-2">
                    <Link
                        href="/customers/credit-report"
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    >
                        Credit Report
                    </Link>
                    <Link
                        href="/customers/create"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add Customer
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6">
                <Link
                    href="/customers"
                    className={clsx(
                        'px-4 py-2 rounded-lg text-sm font-medium',
                        filter === 'all' || !filter
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border'
                    )}
                >
                    All
                </Link>
                <Link
                    href="/customers?filter=with_credit"
                    className={clsx(
                        'px-4 py-2 rounded-lg text-sm font-medium',
                        filter === 'with_credit'
                            ? 'bg-red-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border'
                    )}
                >
                    With Credit
                </Link>
                <Link
                    href="/customers?filter=suki"
                    className={clsx(
                        'px-4 py-2 rounded-lg text-sm font-medium',
                        filter === 'suki'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border'
                    )}
                >
                    Suki Only
                </Link>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Customer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Phone
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Orders
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Total Spent
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Credit Balance
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Credit Limit
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {customers.data.map((customer) => (
                            <tr key={customer.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                            <span className="text-primary-600 font-medium">
                                                {customer.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <Link
                                                href={`/customers/${customer.id}`}
                                                className="text-sm font-medium text-gray-900 hover:text-primary-600"
                                            >
                                                {customer.name}
                                            </Link>
                                            {customer.is_suki && (
                                                <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                                                    ⭐ Suki
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {customer.phone || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {customer.total_orders}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(customer.total_spent)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                        className={clsx(
                                            'text-sm font-medium',
                                            customer.current_balance > 0 ? 'text-red-600' : 'text-gray-500'
                                        )}
                                    >
                                        {customer.current_balance > 0
                                            ? formatCurrency(customer.current_balance)
                                            : '-'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {customer.credit_enabled
                                        ? formatCurrency(customer.credit_limit)
                                        : 'Disabled'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <Link
                                        href={`/customers/${customer.id}`}
                                        className="text-primary-600 hover:text-primary-700 mr-4"
                                    >
                                        View
                                    </Link>
                                    {customer.current_balance > 0 && customer.phone && (
                                        <Link
                                            href={`/customers/${customer.id}/send-reminder`}
                                            method="post"
                                            as="button"
                                            className="text-amber-600 hover:text-amber-700"
                                        >
                                            Send Reminder
                                        </Link>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {customers.data.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No customers found</p>
                        <Link
                            href="/customers/create"
                            className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Add your first customer
                        </Link>
                    </div>
                )}
            </div>
        </TenantLayout>
    );
}
