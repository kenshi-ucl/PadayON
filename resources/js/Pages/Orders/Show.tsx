import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, Order } from '@/types';
import {
    ArrowLeftIcon,
    PrinterIcon,
    CurrencyDollarIcon,
    UserIcon,
    DocumentTextIcon,
    BanknotesIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';

interface OrderItem {
    id: number;
    name: string;
    quantity: number | string;
    unit_price: number | string;
    total: number | string;
    unit?: string;
}

interface Payment {
    id: number;
    amount: number | string;
    method: string;
    status: string;
    paid_at: string | null;
    reference_number?: string;
}

interface ReceiptTenantInfo {
    name: string;
    address: string;
    city: string;
    province: string;
    phone: string;
    email: string;
}

interface OrderShowProps extends PageProps {
    order: Order & {
        items: OrderItem[];
        payments: Payment[];
        customer?: {
            id: number;
            name: string;
            phone?: string;
        };
        user?: {
            name: string;
        };
    };
    receiptInfo: ReceiptTenantInfo;
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
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function OrderShow({ order, receiptInfo }: OrderShowProps) {
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(String(Number(order.balance_due) || 0));
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentReference, setPaymentReference] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleRecordPayment = () => {
        setIsProcessing(true);
        router.post(`/orders/${order.id}/payment`, {
            amount: parseFloat(paymentAmount),
            method: paymentMethod,
            reference: paymentReference || null,
        }, {
            onSuccess: () => {
                setShowPaymentModal(false);
                setPaymentAmount(String(Number(order.balance_due) || 0));
                setPaymentMethod('cash');
                setPaymentReference('');
            },
            onFinish: () => setIsProcessing(false),
        });
    };

    const getStatusColor = (status: string) => {
        return {
            pending: 'bg-yellow-100 text-yellow-700',
            confirmed: 'bg-blue-100 text-blue-700',
            processing: 'bg-indigo-100 text-indigo-700',
            completed: 'bg-green-100 text-green-700',
            cancelled: 'bg-red-100 text-red-700',
        }[status] || 'bg-gray-100 text-gray-700';
    };

    const getPaymentStatusColor = (status: string) => {
        return {
            unpaid: 'bg-red-100 text-red-700',
            partial: 'bg-yellow-100 text-yellow-700',
            paid: 'bg-green-100 text-green-700',
        }[status] || 'bg-gray-100 text-gray-700';
    };

    return (
        <TenantLayout title={`Order ${order.order_number}`}>
            <Head title={`Order ${order.order_number}`} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/orders" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{order.order_number}</h1>
                        <p className="text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowReceiptModal(true)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                    >
                        <PrinterIcon className="h-4 w-4" />
                        View Receipt
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <DocumentTextIcon className="h-5 w-5 text-primary-600" />
                            Order Items
                        </h2>
                        <table className="w-full">
                            <thead>
                                <tr className="border-b text-left text-sm text-gray-500">
                                    <th className="pb-3">Item</th>
                                    <th className="pb-3 text-right">Qty</th>
                                    <th className="pb-3 text-right">Price</th>
                                    <th className="pb-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.id} className="border-b last:border-0">
                                        <td className="py-3">
                                            <p className="font-medium">{item.name}</p>
                                            {item.unit && <p className="text-sm text-gray-500">{item.unit}</p>}
                                        </td>
                                        <td className="py-3 text-right">{Number(item.quantity)}</td>
                                        <td className="py-3 text-right">{formatCurrency(item.unit_price)}</td>
                                        <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Payments */}
                    {order.payments && order.payments.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CurrencyDollarIcon className="h-5 w-5 text-primary-600" />
                                Payment History
                            </h2>
                            <div className="space-y-3">
                                {order.payments.map((payment) => (
                                    <div key={payment.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                        <div>
                                            <p className="font-medium capitalize">{payment.method}</p>
                                            <p className="text-sm text-gray-500">{payment.paid_at ? formatDate(payment.paid_at) : 'Pending'}</p>
                                            {payment.reference_number && (
                                                <p className="text-xs text-gray-400">Ref: {payment.reference_number}</p>
                                            )}
                                        </div>
                                        <p className="font-medium text-green-600">{formatCurrency(payment.amount)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Order Summary */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Status</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Payment</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                                    {order.payment_status}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Type</span>
                                <span className="capitalize">{order.type}</span>
                            </div>
                            {order.is_credit && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Credit Sale</span>
                                    <span className="text-orange-600 font-medium">Yes</span>
                                </div>
                            )}
                        </div>

                        <hr className="my-4" />

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal</span>
                                <span>{formatCurrency(order.subtotal)}</span>
                            </div>
                            {Number(order.discount_amount) > 0 && (
                                <div className="flex justify-between text-red-600">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(order.discount_amount)}</span>
                                </div>
                            )}
                            {Number(order.tax_amount) > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tax</span>
                                    <span>{formatCurrency(order.tax_amount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                <span>Total</span>
                                <span className="text-primary-600">{formatCurrency(order.total)}</span>
                            </div>
                            {Number(order.balance_due) > 0 && (
                                <div className="flex justify-between text-red-600 font-medium">
                                    <span>Balance Due</span>
                                    <span>{formatCurrency(order.balance_due)}</span>
                                </div>
                            )}
                            {Number(order.change_amount) > 0 && (
                                <div className="flex justify-between text-green-600">
                                    <span>Change</span>
                                    <span>{formatCurrency(order.change_amount)}</span>
                                </div>
                            )}
                        </div>

                        {/* Record Payment Button */}
                        {Number(order.balance_due) > 0 && (
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="w-full mt-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                            >
                                <BanknotesIcon className="h-5 w-5" />
                                Record Payment
                            </button>
                        )}
                    </div>

                    {/* Customer Info */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-primary-600" />
                            Customer
                        </h2>
                        {order.customer ? (
                            <div>
                                <Link
                                    href={`/customers/${order.customer.id}`}
                                    className="font-medium text-primary-600 hover:underline"
                                >
                                    {order.customer.name}
                                </Link>
                                {order.customer.phone && (
                                    <p className="text-sm text-gray-500">{order.customer.phone}</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-500">Walk-in Customer</p>
                        )}

                        {order.user && (
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-sm text-gray-500">Processed by</p>
                                <p className="font-medium">{order.user.name}</p>
                            </div>
                        )}
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
                            <p className="text-gray-600">{order.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceiptModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 print:bg-white print:absolute">
                    <div className="bg-white rounded-xl w-full max-w-sm mx-4 print:rounded-none print:shadow-none print:max-w-none print:m-0">
                        {/* Print-only styles */}
                        <style>{`
                            @media print {
                                body * { visibility: hidden !important; }
                                .receipt-content, .receipt-content * { visibility: visible !important; }
                                .receipt-content { 
                                    position: absolute !important; 
                                    left: 0 !important; 
                                    top: 0 !important;
                                    width: 80mm !important;
                                    padding: 10px !important;
                                    font-family: 'Courier New', monospace !important;
                                }
                                .no-print { display: none !important; }
                            }
                        `}</style>

                        <div className="receipt-content p-6 font-mono text-sm">
                            {/* Header */}
                            <div className="text-center mb-4">
                                <h1 className="text-lg font-bold italic">{receiptInfo.name}</h1>
                                {receiptInfo.address && (
                                    <p className="text-xs">{receiptInfo.address}</p>
                                )}
                                {receiptInfo.phone && (
                                    <p className="text-xs">Phone: {receiptInfo.phone}</p>
                                )}
                                {receiptInfo.email && (
                                    <p className="text-xs">Email: {receiptInfo.email}</p>
                                )}
                            </div>

                            {/* Separator */}
                            <div className="border-t border-dashed border-gray-400 my-3"></div>

                            {/* Receipt Details */}
                            <div className="space-y-1 text-xs">
                                <p>Receipt ID: {order.order_number}</p>
                                <p>Date: {new Date(order.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                <p>Time: {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                                <p>Order Type: {order.is_credit ? 'Credit Sale (Utang)' : 'Cash Sale'}</p>
                            </div>

                            {/* Separator */}
                            <div className="border-t border-dashed border-gray-400 my-3"></div>

                            {/* Items */}
                            <div className="space-y-2">
                                {order.items?.map((item) => (
                                    <div key={item.id} className="flex justify-between text-xs">
                                        <span>{item.name} {Number(item.quantity) > 1 ? `x${item.quantity}` : ''}</span>
                                        <span>₱{Number(item.total).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Separator */}
                            <div className="border-t border-dashed border-gray-400 my-3"></div>

                            {/* Totals */}
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>₱{Number(order.subtotal).toFixed(2)}</span>
                                </div>
                                {Number(order.discount_amount) > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Discount:</span>
                                        <span>-₱{Number(order.discount_amount).toFixed(2)}</span>
                                    </div>
                                )}
                                {Number(order.tax_amount) > 0 && (
                                    <div className="flex justify-between">
                                        <span>Tax:</span>
                                        <span>₱{Number(order.tax_amount).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold">
                                    <span>Total:</span>
                                    <span>₱{Number(order.total).toFixed(2)}</span>
                                </div>
                                <p className="mt-2">Payment Method: {order.payment_method ? order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1) : 'N/A'}</p>
                                <p>Category: Sales Revenue</p>
                                {order.customer && (
                                    <p>Customer: {order.customer.name}</p>
                                )}
                            </div>

                            {/* Separator */}
                            <div className="border-t border-dashed border-gray-400 my-3"></div>

                            {/* Footer */}
                            <div className="text-center text-xs mt-4">
                                <p>Thank you for your business!</p>
                                <p className="mt-1">This is an official receipt for your records.</p>
                            </div>
                        </div>

                        {/* Action Buttons (hidden when printing) */}
                        <div className="no-print flex gap-3 p-4 border-t">
                            <button
                                onClick={() => setShowReceiptModal(false)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center gap-2"
                            >
                                <PrinterIcon className="h-5 w-5" />
                                Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl w-full max-w-md mx-4">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">Record Payment</h3>
                            <button onClick={() => setShowPaymentModal(false)}>
                                <XMarkIcon className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Balance Due Display */}
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">Balance Due</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(order.balance_due)}</p>
                            </div>

                            {/* Amount Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Amount
                                </label>
                                <input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    max={Number(order.balance_due)}
                                    step="0.01"
                                    className="w-full px-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Method
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['cash', 'gcash', 'maya', 'card'].map((method) => (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setPaymentMethod(method)}
                                            className={`py-2 px-4 rounded-lg border-2 font-medium capitalize transition-colors ${paymentMethod === method
                                                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Reference Number */}
                            {paymentMethod !== 'cash' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reference Number (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={paymentReference}
                                        onChange={(e) => setPaymentReference(e.target.value)}
                                        placeholder="e.g., Transaction ID"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 p-4 border-t">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRecordPayment}
                                disabled={isProcessing || parseFloat(paymentAmount) <= 0 || parseFloat(paymentAmount) > Number(order.balance_due)}
                                className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? 'Processing...' : 'Record Payment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
