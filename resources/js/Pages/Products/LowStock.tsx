import React from 'react';
import { Head, Link } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, Product, Category } from '@/types';
import {
    ArrowLeftIcon,
    ExclamationTriangleIcon,
    CubeIcon,
} from '@heroicons/react/24/outline';

interface LowStockProps extends PageProps {
    products: {
        data: (Product & { category?: Category })[];
        links: any;
        current_page: number;
        last_page: number;
    };
}

const formatCurrency = (amount: number | string | undefined | null): string => {
    const num = Number(amount) || 0;
    return '₱' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

export default function LowStock({ products }: LowStockProps) {
    return (
        <TenantLayout title="Low Stock Products">
            <Head title="Low Stock Products" />

            {/* Back link */}
            <div className="mb-6">
                <Link href="/products" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to Products
                </Link>
            </div>

            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-7 w-7 text-yellow-500" />
                    Low Stock Products
                </h2>
                <p className="text-gray-600 mt-1">
                    Products that are at or below their low stock threshold.
                </p>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-xl shadow-sm">
                {products.data.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No low stock products</h3>
                        <p className="mt-1 text-sm text-gray-500">All products have sufficient stock levels.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {products.data.map((product) => {
                                        const isOutOfStock = product.stock_quantity <= 0;
                                        const isCritical = product.stock_quantity > 0 && product.stock_quantity <= Math.floor(product.low_stock_threshold / 2);
                                        return (
                                            <tr key={product.id} className={`hover:bg-gray-50 ${isOutOfStock ? 'bg-red-50' : isCritical ? 'bg-amber-50' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        {product.image ? (
                                                            <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                                <CubeIcon className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <Link href={`/products/${product.id}`} className="font-medium text-gray-900 hover:text-primary-600">
                                                                {product.name}
                                                            </Link>
                                                            {product.barcode && (
                                                                <p className="text-xs text-gray-400">{product.barcode}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.category?.name || 'Uncategorized'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {product.sku || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                        isOutOfStock
                                                            ? 'bg-red-100 text-red-700'
                                                            : isCritical
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                        {product.stock_quantity} {product.stock_unit || 'pcs'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                                    {product.low_stock_threshold} {product.stock_unit || 'pcs'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                                    {formatCurrency(product.selling_price)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <Link href={`/products/${product.id}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {products.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Page {products.current_page} of {products.last_page}
                                </p>
                                <div className="flex gap-2">
                                    {products.links && products.links.map((link: any, index: number) => (
                                        link.url ? (
                                            <Link
                                                key={index}
                                                href={link.url}
                                                className={`px-3 py-1 rounded text-sm ${
                                                    link.active
                                                        ? 'bg-primary-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={index}
                                                className="px-3 py-1 rounded text-sm bg-gray-50 text-gray-400"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </TenantLayout>
    );
}
