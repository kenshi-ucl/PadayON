import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, Order } from '@/types';
import {
    MagnifyingGlassIcon,
    DocumentTextIcon,
    FunnelIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface OrdersProps extends PageProps {
    orders: {
        data: Order[];
        links: any;
    };
    stats: {
        total: number;
        today: number;
        pending: number;
        total_revenue: number;
    };
    filters: {
        type?: string;
        status?: string;
        payment_status?: string;
        from?: string;
        to?: string;
        search?: string;
    };
}

const formatCurrency = (amount: number | string | undefined | null): string => {
    const num = Number(amount) || 0;
    return '₱' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function OrdersIndex({ orders, stats, filters }: OrdersProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/orders', { ...filters, search: searchQuery }, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get('/orders', { ...filters, [key]: value || undefined }, { preserveState: true });
    };

    const getStatusBadgeColor = (status: string) => {
        return {
            pending: 'bg-yellow-100 text-yellow-700',
            confirmed: 'bg-blue-100 text-blue-700',
            processing: 'bg-purple-100 text-purple-700',
            completed: 'bg-green-100 text-green-700',
            cancelled: 'bg-gray-100 text-gray-700',
            refunded: 'bg-red-100 text-red-700',
        }[status] || 'bg-gray-100 text-gray-700';
    };

    const getPaymentStatusBadgeColor = (status: string) => {
        return {
            unpaid: 'bg-red-100 text-red-700',
            partial: 'bg-yellow-100 text-yellow-700',
            paid: 'bg-green-100 text-green-700',
            refunded: 'bg-gray-100 text-gray-700',
        }[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <TenantLayout title="Orders">
            <Head title="Orders" />

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Today</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_revenue)}</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="bg-white rounded-xl shadow-sm mb-6">
                <div className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <form onSubmit={handleSearch} className="flex-1 w-full sm:w-auto">
                        <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search order number or customer..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full"
                            />
                        </div>
                    </form>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                    >
                        <FunnelIcon className="h-5 w-5" />
                        Filters
                    </button>
                </div>

                {showFilters && (
                    <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t pt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                value={filters.type || ''}
                                onChange={(e) => handleFilterChange('type', e.target.value)}
                                className="w-full rounded-lg border-gray-300"
                            >
                                <option value="">All Types</option>
                                <option value="pos">POS</option>
                                <option value="online">Online</option>
                                <option value="laundry">Laundry</option>
                                <option value="catering">Catering</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={filters.status || ''}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full rounded-lg border-gray-300"
                            >
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Payment</label>
                            <select
                                value={filters.payment_status || ''}
                                onChange={(e) => handleFilterChange('payment_status', e.target.value)}
                                className="w-full rounded-lg border-gray-300"
                            >
                                <option value="">All</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={filters.from || ''}
                                onChange={(e) => handleFilterChange('from', e.target.value)}
                                className="w-full rounded-lg border-gray-300"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Order
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Payment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {orders.data.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-gray-900">{order.order_number}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-900">
                                            {order.customer?.name || order.customer_name || 'Walk-in'}
                                        </p>
                                        {order.customer_phone && (
                                            <p className="text-xs text-gray-500">{order.customer_phone}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="capitalize text-sm text-gray-700">{order.type}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                                        {order.is_credit && (
                                            <p className="text-xs text-red-600">Credit</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={clsx(
                                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                                            getStatusBadgeColor(order.status)
                                        )}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={clsx(
                                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                                            getPaymentStatusBadgeColor(order.payment_status)
                                        )}>
                                            {order.payment_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {formatDate(order.created_at)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/orders/${order.id}`}
                                            className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {orders.data.length === 0 && (
                    <div className="text-center py-12">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-gray-500">No orders found</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {orders.links && orders.links.length > 3 && (
                <div className="mt-6 flex justify-center">
                    <nav className="flex gap-1">
                        {orders.links.map((link: any, index: number) => (
                            <Link
                                key={index}
                                href={link.url || '#'}
                                className={clsx(
                                    'px-3 py-2 rounded-lg text-sm',
                                    link.active
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-white text-gray-700 hover:bg-gray-50',
                                    !link.url && 'opacity-50 cursor-not-allowed'
                                )}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </nav>
                </div>
            )}
        </TenantLayout>
    );
}
