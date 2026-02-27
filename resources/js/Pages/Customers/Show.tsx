import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, Customer } from '@/types';
import {
    ArrowLeftIcon,
    PencilIcon,
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    ClockIcon,
    BanknotesIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface CreditTransaction {
    id: number;
    type: string;
    amount: number | string;
    balance_before: number | string;
    balance_after: number | string;
    description: string | null;
    created_at: string;
    order?: { order_number: string };
    payment?: { payment_number: string };
}

interface CustomerShowProps extends PageProps {
    customer: Customer & {
        orders?: Array<{
            id: number;
            order_number: string;
            total: number | string;
            payment_status: string;
            created_at: string;
        }>;
    };
    creditHistory: CreditTransaction[];
    stats: {
        total_orders: number;
        total_spent: number | string;
        average_order: number | string;
        days_as_customer: number;
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
        year: 'numeric',
    });
};

export default function CustomerShow({ customer, creditHistory, stats }: CustomerShowProps) {
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        method: 'cash',
        reference: '',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setIsSubmitting(true);
        router.post(`/customers/${customer.id}/payment`, paymentData, {
            onSuccess: () => {
                toast.success('Payment recorded successfully');
                setShowPaymentModal(false);
                setPaymentData({ amount: '', method: 'cash', reference: '', notes: '' });
            },
            onError: (errors) => {
                toast.error(Object.values(errors)[0] as string || 'Failed to record payment');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <TenantLayout title={customer.name}>
            <Head title={customer.name} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/customers" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                            {customer.is_suki && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                    ⭐ Suki
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500">Customer since {formatDate(customer.created_at)}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {Number(customer.current_balance) > 0 && (
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <BanknotesIcon className="h-4 w-4" />
                            Record Payment
                        </button>
                    )}
                    <Link
                        href={`/customers/${customer.id}/edit`}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <PencilIcon className="h-4 w-4" />
                        Edit
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Contact Info */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {customer.phone && (
                                <div className="flex items-center gap-3">
                                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                                    <span>{customer.phone}</span>
                                </div>
                            )}
                            {customer.email && (
                                <div className="flex items-center gap-3">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                    <span>{customer.email}</span>
                                </div>
                            )}
                            {customer.address && (
                                <div className="flex items-center gap-3 md:col-span-2">
                                    <MapPinIcon className="h-5 w-5 text-gray-400" />
                                    <span>{customer.address}</span>
                                </div>
                            )}
                        </div>
                        {customer.notes && (
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-sm text-gray-500">Notes</p>
                                <p className="text-gray-700">{customer.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Credit History */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <ClockIcon className="h-5 w-5 text-primary-600" />
                            Credit History
                        </h2>
                        {creditHistory.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No credit transactions</p>
                        ) : (
                            <div className="space-y-3">
                                {creditHistory.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                        <div>
                                            <p className="font-medium capitalize">{tx.type}</p>
                                            <p className="text-sm text-gray-500">{tx.description || 'No description'}</p>
                                            <p className="text-xs text-gray-400">{formatDate(tx.created_at)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-medium ${tx.type === 'payment' ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.type === 'payment' ? '-' : '+'}{formatCurrency(tx.amount)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Balance: {formatCurrency(tx.balance_after)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Orders */}
                    {customer.orders && customer.orders.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
                            <div className="space-y-3">
                                {customer.orders.map((order) => (
                                    <Link
                                        key={order.id}
                                        href={`/orders/${order.id}`}
                                        className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded"
                                    >
                                        <div>
                                            <p className="font-medium">{order.order_number}</p>
                                            <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{formatCurrency(order.total)}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                                                    order.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {order.payment_status}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Balance Card */}
                    <div className={`rounded-xl shadow-sm p-6 ${Number(customer.current_balance) > 0 ? 'bg-red-50 border border-red-200' : 'bg-white'}`}>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Outstanding Balance</h2>
                        <p className={`text-3xl font-bold ${Number(customer.current_balance) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(customer.current_balance)}
                        </p>
                        {customer.credit_enabled && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Credit Limit</span>
                                    <span className="font-medium">{formatCurrency(customer.credit_limit)}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span className="text-gray-500">Available Credit</span>
                                    <span className="font-medium text-green-600">
                                        {formatCurrency(Number(customer.credit_limit) - Number(customer.current_balance))}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Stats</h2>
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm text-gray-500">Total Orders</span>
                                <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Total Spent</span>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_spent)}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Avg. Order Value</span>
                                <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.average_order)}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Customer For</span>
                                <p className="text-2xl font-bold text-gray-900">{stats.days_as_customer} days</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowPaymentModal(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h3>
                        <p className="text-gray-600 mb-4">
                            Current balance: <span className="font-bold text-red-600">{formatCurrency(customer.current_balance)}</span>
                        </p>
                        <form onSubmit={handlePayment}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                                        <input
                                            type="number"
                                            value={paymentData.amount}
                                            onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                            max={Number(customer.current_balance)}
                                            step="0.01"
                                            className="w-full pl-8 pr-4 py-2 border rounded-lg"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                    <select
                                        value={paymentData.method}
                                        onChange={(e) => setPaymentData({ ...paymentData, method: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    >
                                        <option value="cash">Cash</option>
                                        <option value="gcash">GCash</option>
                                        <option value="maya">Maya</option>
                                        <option value="card">Card</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reference (Optional)</label>
                                    <input
                                        type="text"
                                        value={paymentData.reference}
                                        onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                        placeholder="Transaction ID, receipt number, etc."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                                    <textarea
                                        value={paymentData.notes}
                                        onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
                                >
                                    {isSubmitting ? 'Saving...' : 'Record Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
