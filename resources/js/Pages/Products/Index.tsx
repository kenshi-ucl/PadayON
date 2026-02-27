import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, Product, Category, Tenant } from '@/types';
import {
    MagnifyingGlassIcon,
    PlusIcon,
    CubeIcon,
    ExclamationTriangleIcon,
    FunnelIcon,
    TrashIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface ProductsProps extends PageProps {
    products: {
        data: Product[];
        links: any;
    };
    categories: Category[];
    filters: {
        search?: string;
        category?: string;
        low_stock?: boolean;
    };
}

const formatCurrency = (amount: number | string | undefined | null): string => {
    const num = Number(amount) || 0;
    return '₱' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

export default function ProductsIndex({ products, categories, filters }: ProductsProps) {
    const { tenant } = usePage().props as any;
    const isService = tenant?.business_type === 'general_service';

    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/products', { ...filters, search: searchQuery }, { preserveState: true });
    };

    const handleCategoryChange = (categoryId: string) => {
        router.get('/products', { ...filters, category: categoryId || undefined }, { preserveState: true });
    };

    const handleDelete = () => {
        if (!deleteProduct) return;
        setIsDeleting(true);
        router.delete(`/products/${deleteProduct.id}`, {
            onSuccess: () => {
                toast.success(`${isService ? 'Service' : 'Product'} deleted successfully!`);
                setDeleteProduct(null);
            },
            onError: () => {
                toast.error(`Failed to delete ${isService ? 'service' : 'product'}`);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <TenantLayout title={isService ? "Services" : "Products"}>
            <Head title={isService ? "Services" : "Products"} />

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm mb-6">
                <div className="p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2 overflow-x-auto w-full lg:w-auto">
                        <button
                            onClick={() => handleCategoryChange('')}
                            className={clsx(
                                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap',
                                !filters.category
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            )}
                        >
                            {isService ? 'All Services' : 'All Products'}
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => handleCategoryChange(category.id.toString())}
                                className={clsx(
                                    'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap',
                                    filters.category === category.id.toString()
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                )}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-3 w-full lg:w-auto">
                        <form onSubmit={handleSearch} className="flex-1 lg:flex-initial">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={isService ? "Search services..." : "Search products..."}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full lg:w-64"
                                />
                            </div>
                        </form>

                        {!isService && (
                            <Link
                                href="/products/low-stock"
                                className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
                            >
                                <ExclamationTriangleIcon className="h-5 w-5" />
                                Low Stock
                            </Link>
                        )}

                        <Link
                            href="/products/create"
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            <PlusIcon className="h-5 w-5" />
                            {isService ? 'Add Service' : 'Add Product'}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.data.map((product) => (
                    <div
                        key={product.id}
                        className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow relative group"
                    >
                        <Link href={`/products/${product.id}`}>
                            <div className="aspect-square bg-gray-100 relative">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <CubeIcon className="h-16 w-16 text-gray-300" />
                                    </div>
                                )}
                                {product.track_inventory && product.stock_quantity <= product.low_stock_threshold && (
                                    <div className="absolute top-2 left-2">
                                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                                            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                                            Low Stock
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-gray-500">{product.category?.name || 'Uncategorized'}</p>
                                <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                                <div className="mt-2 flex items-center justify-between">
                                    <p className="text-lg font-bold text-primary-600">
                                        {formatCurrency(product.selling_price)}
                                    </p>
                                    {product.track_inventory && (
                                        <p className={clsx(
                                            'text-sm',
                                            product.stock_quantity <= product.low_stock_threshold
                                                ? 'text-red-600'
                                                : 'text-gray-500'
                                        )}>
                                            {product.stock_quantity} in stock
                                        </p>
                                    )}
                                </div>
                                {product.allow_tingi && product.tingi_price && (
                                    <p className="text-sm text-secondary-600 mt-1">
                                        Tingi: {formatCurrency(product.tingi_price)}
                                    </p>
                                )}
                            </div>
                        </Link>
                        {/* Delete button - appears on hover */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeleteProduct(product);
                            }}
                            className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete product"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>

            {products.data.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No products found</p>
                    <Link
                        href="/products/create"
                        className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add your first product
                    </Link>
                </div>
            )}

            {/* Pagination */}
            {products.links && products.links.length > 3 && (
                <div className="mt-6 flex justify-center">
                    <nav className="flex gap-1">
                        {products.links.map((link: any, index: number) => (
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

            {/* Delete Confirmation Modal */}
            {deleteProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setDeleteProduct(null)}>
                    <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{deleteProduct.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteProduct(null)}
                                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </TenantLayout>
    );
}
