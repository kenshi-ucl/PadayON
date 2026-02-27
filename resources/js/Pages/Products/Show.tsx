import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Head, Link, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, Product, Category } from '@/types';
import {
    ArrowLeftIcon,
    PencilIcon,
    CubeIcon,
    TagIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    ClockIcon,
    PlusIcon,
    MinusIcon,
    QrCodeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface StockMovement {
    id: number;
    type: string;
    quantity: number;
    stock_before: number;
    stock_after: number;
    notes: string | null;
    created_at: string;
    user?: {
        name: string;
    };
}

interface ProductShowProps extends PageProps {
    product: Product & {
        category?: Category;
    };
    stockHistory: StockMovement[];
    stats: {
        total_sold: number;
        total_revenue: number | string;
        average_daily_sales: number | string;
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
        hour: '2-digit',
        minute: '2-digit',
    });
};

export default function ProductShow({ product, stockHistory, stats }: ProductShowProps) {
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustmentData, setAdjustmentData] = useState({
        adjustment: 0,
        type: 'adjustment',
        notes: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAdjustStock = (e: React.FormEvent) => {
        e.preventDefault();
        if (adjustmentData.adjustment === 0) {
            toast.error('Adjustment cannot be zero');
            return;
        }

        setIsSubmitting(true);
        router.post(`/products/${product.id}/adjust-stock`, adjustmentData, {
            onSuccess: () => {
                toast.success('Stock adjusted successfully');
                setShowAdjustModal(false);
                setAdjustmentData({ adjustment: 0, type: 'adjustment', notes: '' });
            },
            onError: () => {
                toast.error('Failed to adjust stock');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    const getStockStatusColor = () => {
        if (product.stock_quantity <= 0) return 'text-red-600 bg-red-50';
        if (product.stock_quantity <= product.low_stock_threshold) return 'text-yellow-600 bg-yellow-50';
        return 'text-green-600 bg-green-50';
    };

    const getStockStatusText = () => {
        if (product.stock_quantity <= 0) return 'Out of Stock';
        if (product.stock_quantity <= product.low_stock_threshold) return 'Low Stock';
        return 'In Stock';
    };

    return (
        <TenantLayout title={product.name}>
            <Head title={product.name} />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/products" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                        {product.category && (
                            <p className="text-gray-500">{product.category.name}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAdjustModal(true)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Adjust Stock
                    </button>
                    <Link
                        href={`/products/${product.id}/edit`}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                    >
                        <PencilIcon className="h-4 w-4" />
                        Edit Product
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Product Details Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CubeIcon className="h-5 w-5 text-primary-600" />
                            Product Details
                        </h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-gray-500">SKU</span>
                                <p className="font-medium">{product.sku || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Barcode</span>
                                <p className="font-medium">{product.barcode || 'N/A'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Unit</span>
                                <p className="font-medium">{product.stock_unit || 'piece'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Status</span>
                                <p className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {product.is_active ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                        </div>
                        {product.description && (
                            <div className="mt-4 pt-4 border-t">
                                <span className="text-sm text-gray-500">Description</span>
                                <p className="mt-1 text-gray-700">{product.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Pricing Card */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CurrencyDollarIcon className="h-5 w-5 text-primary-600" />
                            Pricing
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <span className="text-sm text-gray-500">Cost Price</span>
                                <p className="text-xl font-semibold text-gray-900">{formatCurrency(product.cost_price)}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Selling Price</span>
                                <p className="text-xl font-semibold text-green-600">{formatCurrency(product.selling_price)}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Profit Margin</span>
                                <p className="text-xl font-semibold text-blue-600">
                                    {formatCurrency(Number(product.selling_price) - Number(product.cost_price))}
                                </p>
                            </div>
                        </div>
                        {product.allow_tingi && (
                            <div className="mt-4 pt-4 border-t">
                                <p className="text-sm text-gray-500 mb-2">Tingi Sales Enabled</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-sm text-gray-500">Tingi Price</span>
                                        <p className="font-medium">{formatCurrency(product.tingi_price)}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">Pieces per Pack</span>
                                        <p className="font-medium">{product.pieces_per_pack || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stock History */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <ClockIcon className="h-5 w-5 text-primary-600" />
                            Stock History
                        </h2>
                        {stockHistory.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No stock movements recorded</p>
                        ) : (
                            <div className="space-y-3">
                                {stockHistory.map((movement) => (
                                    <div key={movement.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                        <div>
                                            <p className="font-medium capitalize">{movement.type}</p>
                                            <p className="text-sm text-gray-500">{movement.notes || 'No notes'}</p>
                                            <p className="text-xs text-gray-400">{formatDate(movement.created_at)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {movement.stock_before} → {movement.stock_after}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Stock Status */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
                        <div className="text-center">
                            <p className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mb-2 ${getStockStatusColor()}`}>
                                {getStockStatusText()}
                            </p>
                            <p className="text-4xl font-bold text-gray-900">{product.stock_quantity}</p>
                            <p className="text-gray-500">{product.stock_unit || 'pieces'}</p>
                            <div className="mt-4 pt-4 border-t text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Low Stock Alert</span>
                                    <span className="font-medium">{product.low_stock_threshold}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sales Stats */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <ChartBarIcon className="h-5 w-5 text-primary-600" />
                            Sales Stats
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <span className="text-sm text-gray-500">Total Sold</span>
                                <p className="text-2xl font-bold text-gray-900">{Number(stats.total_sold) || 0}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Total Revenue</span>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_revenue)}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Avg. Daily Sales (30d)</span>
                                <p className="text-2xl font-bold text-blue-600">{Number(stats.average_daily_sales).toFixed(1) || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* QR Code */}
                    {product.qr_token && (
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <QrCodeIcon className="h-5 w-5 text-primary-600" />
                                QR Code
                            </h2>
                            <div className="flex flex-col items-center">
                                <div className="bg-white p-4 rounded-xl border-2 border-gray-100">
                                    <QRCode
                                        value={`${product.tenant_id}:${product.qr_token}`}
                                        size={160}
                                        level="M"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-3 text-center break-all">
                                    {product.qr_token}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Scan this code in the Scanner</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Adjust Stock Modal */}
            {showAdjustModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowAdjustModal(false)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adjust Stock</h3>
                        <form onSubmit={handleAdjustStock}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                                    <select
                                        value={adjustmentData.type}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, type: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg"
                                    >
                                        <option value="purchase">Purchase (Add Stock)</option>
                                        <option value="adjustment">Manual Adjustment</option>
                                        <option value="damage">Damage (Remove Stock)</option>
                                        <option value="return">Customer Return</option>
                                        <option value="transfer">Transfer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAdjustmentData({ ...adjustmentData, adjustment: adjustmentData.adjustment - 1 })}
                                            className="p-2 border rounded-lg hover:bg-gray-50"
                                        >
                                            <MinusIcon className="h-5 w-5" />
                                        </button>
                                        <input
                                            type="number"
                                            value={adjustmentData.adjustment}
                                            onChange={(e) => setAdjustmentData({ ...adjustmentData, adjustment: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-2 border rounded-lg text-center"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setAdjustmentData({ ...adjustmentData, adjustment: adjustmentData.adjustment + 1 })}
                                            className="p-2 border rounded-lg hover:bg-gray-50"
                                        >
                                            <PlusIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        New stock: {product.stock_quantity + adjustmentData.adjustment}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                    <textarea
                                        value={adjustmentData.notes}
                                        onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                                        rows={2}
                                        placeholder="Optional notes..."
                                        className="w-full px-4 py-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAdjustModal(false)}
                                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || adjustmentData.adjustment === 0}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Adjustment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
