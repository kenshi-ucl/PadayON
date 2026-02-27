import React, { useState, FormEvent } from 'react';
import { Head, router, Link, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, Category } from '@/types';
import {
    ArrowLeftIcon,
    PhotoIcon,
    CubeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ProductCreateProps extends PageProps {
    categories: Category[];
    units: string[];
}

export default function ProductCreate({ categories, units }: ProductCreateProps) {
    const { tenant } = usePage().props as any;
    const isService = tenant?.business_type === 'general_service';

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category_id: '',
        sku: '',
        barcode: '',
        cost_price: '0',
        selling_price: '',
        stock_unit: 'piece',
        track_inventory: true,
        stock_quantity: '0',
        low_stock_threshold: '10',
        allow_tingi: false,
        tingi_price: '',
        pieces_per_pack: '',
        is_active: true,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.selling_price) {
            toast.error('Please fill in required fields');
            return;
        }

        setIsSubmitting(true);

        // Create FormData for file upload
        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('category_id', formData.category_id || '');
        data.append('sku', formData.sku);
        data.append('barcode', formData.barcode);
        data.append('cost_price', String(parseFloat(formData.cost_price) || 0));
        data.append('selling_price', String(parseFloat(formData.selling_price)));
        data.append('stock_unit', formData.stock_unit);
        data.append('track_inventory', formData.track_inventory ? '1' : '0');
        data.append('stock_quantity', String(parseInt(formData.stock_quantity) || 0));
        data.append('low_stock_threshold', String(parseInt(formData.low_stock_threshold) || 10));
        data.append('allow_tingi', formData.allow_tingi ? '1' : '0');
        data.append('is_active', formData.is_active ? '1' : '0');
        if (formData.tingi_price) data.append('tingi_price', formData.tingi_price);
        if (formData.pieces_per_pack) data.append('pieces_per_pack', formData.pieces_per_pack);
        if (imageFile) data.append('image', imageFile);

        router.post('/products', data, {
            forceFormData: true,
            onSuccess: () => {
                toast.success(`${isService ? 'Service' : 'Product'} created successfully!`);
            },
            onError: (errors) => {
                toast.error(Object.values(errors)[0] as string || 'Failed to create product');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <TenantLayout title={isService ? "Add Service" : "Add Product"}>
            <Head title={isService ? "Add Service" : "Add Product"} />

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/products" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isService ? 'Add New Service' : 'Add New Product'}
                    </h1>
                    <p className="text-gray-500">
                        {isService ? 'Create a new service offering' : 'Create a new product for your inventory'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <CubeIcon className="h-5 w-5 text-primary-600" />
                                {isService ? 'Service Information' : 'Product Information'}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {isService ? 'Service Name *' : 'Product Name *'}
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder={isService ? "e.g., Haircut, Repair Service" : "e.g., Lucky Me Pancit Canton"}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        name="category_id"
                                        value={formData.category_id}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="">Select category</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Unit *</label>
                                    <select
                                        name="stock_unit"
                                        value={formData.stock_unit}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        {units.map((unit) => (
                                            <option key={unit} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleChange}
                                        placeholder="Optional"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                                    <input
                                        type="text"
                                        name="barcode"
                                        value={formData.barcode}
                                        onChange={handleChange}
                                        placeholder="Optional"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Product Image */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <PhotoIcon className="h-5 w-5 text-primary-600" />
                                Product Image
                            </h2>
                            <div className="space-y-4">
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-48 object-cover rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <PhotoIcon className="h-12 w-12 text-gray-400 mb-3" />
                                            <p className="mb-2 text-sm text-gray-500">
                                                <span className="font-semibold">Click to upload</span> or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 50MB</p>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                                        <input
                                            type="number"
                                            name="cost_price"
                                            value={formData.cost_price}
                                            onChange={handleChange}
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                                        <input
                                            type="number"
                                            name="selling_price"
                                            value={formData.selling_price}
                                            onChange={handleChange}
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tingi (Retail Pieces) */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Tingi (Retail Pieces)</h2>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="allow_tingi"
                                        checked={formData.allow_tingi}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">Allow tingi sales</span>
                                </label>
                            </div>
                            {formData.allow_tingi && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tingi Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                                            <input
                                                type="number"
                                                name="tingi_price"
                                                value={formData.tingi_price}
                                                onChange={handleChange}
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pieces per Pack</label>
                                        <input
                                            type="number"
                                            name="pieces_per_pack"
                                            value={formData.pieces_per_pack}
                                            onChange={handleChange}
                                            min="1"
                                            placeholder="e.g., 6"
                                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Inventory */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventory</h2>
                            <div className="space-y-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="track_inventory"
                                        checked={formData.track_inventory}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">Track inventory</span>
                                </label>
                                {formData.track_inventory && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                                            <input
                                                type="number"
                                                name="stock_quantity"
                                                value={formData.stock_quantity}
                                                onChange={handleChange}
                                                min="0"
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
                                            <input
                                                type="number"
                                                name="low_stock_threshold"
                                                value={formData.low_stock_threshold}
                                                onChange={handleChange}
                                                min="0"
                                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Status */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700">Active (visible in POS)</span>
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-gray-300"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Product'}
                        </button>
                    </div>
                </div>
            </form>
        </TenantLayout >
    );
}
