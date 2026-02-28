import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, Tenant, Category } from '@/types';
import {
    BuildingStorefrontIcon,
    CreditCardIcon,
    BellIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    TagIcon,
    TrashIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface SettingsProps extends PageProps {
    tenant: Tenant;
    categories: Category[];
}

type TabType = 'business' | 'payment' | 'notifications' | 'team' | 'categories';

export default function SettingsIndex({ tenant, categories }: SettingsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('business');

    // ─── Business form ────────────────────────────────────────────────────────
    const businessForm = useForm({
        business_name: tenant.business_name || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        business_address: tenant.business_address || '',
        city: tenant.city || '',
        province: tenant.province || '',
    });

    // ─── Payment form ──────────────────────────────────────────────────────────
    const paymentForm = useForm({
        gcash_enabled: tenant.gcash_enabled,
        maya_enabled: tenant.maya_enabled,
        card_enabled: tenant.card_enabled,
        cod_enabled: tenant.cod_enabled,
    });

    // ─── Categories local state ────────────────────────────────────────────────
    const [newCategoryName, setNewCategoryName] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const tabs = [
        { id: 'business' as TabType, name: 'Business', icon: BuildingStorefrontIcon },
        { id: 'payment' as TabType, name: 'Payment', icon: CreditCardIcon },
        { id: 'notifications' as TabType, name: 'Notifications', icon: BellIcon },
        { id: 'team' as TabType, name: 'Team', icon: UserGroupIcon },
        { id: 'categories' as TabType, name: 'Categories', icon: TagIcon },
    ];

    const handleBusinessSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        businessForm.patch('/settings/business', {
            onSuccess: () => toast.success('Business settings updated'),
        });
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        paymentForm.patch('/settings/payment', {
            onSuccess: () => toast.success('Payment settings updated'),
        });
    };

    // ─── Category handlers ─────────────────────────────────────────────────────
    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        const name = newCategoryName.trim();
        if (!name) return;

        setAddingCategory(true);
        router.post(
            '/settings/categories',
            { name },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNewCategoryName('');
                    toast.success('Category added successfully');
                },
                onError: () => toast.error('Failed to add category'),
                onFinish: () => setAddingCategory(false),
            }
        );
    };

    const handleDeleteCategory = (category: Category) => {
        if (!window.confirm(`Delete category "${category.name}"? This cannot be undone.`)) return;

        setDeletingId(category.id);
        router.delete(`/settings/categories/${category.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Category deleted'),
            onError: (errors) => {
                const msg = errors.error || 'Cannot delete this category';
                toast.error(msg);
            },
            onFinish: () => setDeletingId(null),
        });
    };

    const handleToggleActive = (category: Category) => {
        router.patch(
            `/settings/categories/${category.id}`,
            { name: category.name, is_active: !category.is_active },
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success(
                        category.is_active ? 'Category hidden' : 'Category activated'
                    ),
                onError: () => toast.error('Failed to update category'),
            }
        );
    };

    return (
        <TenantLayout title="Settings">
            <Head title="Settings" />

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="lg:w-64">
                    <nav className="bg-white rounded-xl shadow-sm p-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium',
                                    activeTab === tab.id
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                )}
                            >
                                <tab.icon className="h-5 w-5" />
                                {tab.name}
                            </button>
                        ))}
                    </nav>

                    {/* Plan Info */}
                    <div className="mt-6 bg-white rounded-xl shadow-sm p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <CurrencyDollarIcon className="h-6 w-6 text-primary-600" />
                            <div>
                                <p className="font-medium text-gray-900">
                                    {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)} Plan
                                </p>
                                <p className="text-sm text-gray-500">
                                    {tenant.trial_ends_at
                                        ? `Trial ends ${new Date(tenant.trial_ends_at).toLocaleDateString()}`
                                        : 'Active subscription'}
                                </p>
                            </div>
                        </div>
                        <a
                            href="/settings/subscription"
                            className="block w-full text-center py-2 px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                        >
                            {tenant.plan === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
                        </a>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {/* ── Business ── */}
                    {activeTab === 'business' && (
                        <form onSubmit={handleBusinessSubmit} className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Business Information</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Business Name
                                    </label>
                                    <input
                                        type="text"
                                        value={businessForm.data.business_name}
                                        onChange={(e) => businessForm.setData('business_name', e.target.value)}
                                        className="w-full rounded-lg border-gray-300"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            value={businessForm.data.email}
                                            onChange={(e) => businessForm.setData('email', e.target.value)}
                                            className="w-full rounded-lg border-gray-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone
                                        </label>
                                        <input
                                            type="tel"
                                            value={businessForm.data.phone}
                                            onChange={(e) => businessForm.setData('phone', e.target.value)}
                                            className="w-full rounded-lg border-gray-300"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        value={businessForm.data.business_address}
                                        onChange={(e) => businessForm.setData('business_address', e.target.value)}
                                        className="w-full rounded-lg border-gray-300"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            City/Municipality
                                        </label>
                                        <input
                                            type="text"
                                            value={businessForm.data.city}
                                            onChange={(e) => businessForm.setData('city', e.target.value)}
                                            className="w-full rounded-lg border-gray-300"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Province
                                        </label>
                                        <input
                                            type="text"
                                            value={businessForm.data.province}
                                            onChange={(e) => businessForm.setData('province', e.target.value)}
                                            className="w-full rounded-lg border-gray-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button
                                    type="submit"
                                    disabled={businessForm.processing}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Payment ── */}
                    {activeTab === 'payment' && (
                        <form onSubmit={handlePaymentSubmit} className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Payment Methods</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Choose which payment methods to accept from your customers.
                            </p>

                            <div className="space-y-4">
                                {[
                                    { key: 'gcash_enabled', name: 'GCash', fee: '2.5%', icon: '📱' },
                                    { key: 'maya_enabled', name: 'Maya', fee: '2.5%', icon: '💳' },
                                    { key: 'card_enabled', name: 'Credit/Debit Card', fee: '3.5% + ₱15', icon: '💳' },
                                    { key: 'cod_enabled', name: 'Cash on Delivery', fee: 'Varies', icon: '💵' },
                                ].map((method) => (
                                    <label
                                        key={method.key}
                                        className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{method.icon}</span>
                                            <div>
                                                <p className="font-medium text-gray-900">{method.name}</p>
                                                <p className="text-sm text-gray-500">Fee: {method.fee}</p>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={paymentForm.data[method.key as keyof typeof paymentForm.data]}
                                            onChange={(e) => paymentForm.setData(method.key as any, e.target.checked)}
                                            className="h-5 w-5 rounded border-gray-300 text-primary-600"
                                        />
                                    </label>
                                ))}
                            </div>

                            <div className="mt-6">
                                <button
                                    type="submit"
                                    disabled={paymentForm.processing}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    )}

                    {/* ── Notifications ── */}
                    {activeTab === 'notifications' && (
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Settings</h2>

                            <div className="space-y-6">
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-3">SMS Notifications</h3>
                                    <div className="space-y-3">
                                        {[
                                            'Send order confirmation SMS',
                                            'Send credit reminder SMS',
                                            'Send laundry ready notification',
                                            'Send catering event reminder',
                                        ].map((option, index) => (
                                            <label key={index} className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    defaultChecked
                                                    className="h-4 w-4 rounded border-gray-300 text-primary-600"
                                                />
                                                <span className="text-sm text-gray-700">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-medium text-gray-900 mb-3">Email Notifications</h3>
                                    <div className="space-y-3">
                                        {[
                                            'Daily sales summary',
                                            'Low stock alerts',
                                            'New online orders',
                                        ].map((option, index) => (
                                            <label key={index} className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    defaultChecked
                                                    className="h-4 w-4 rounded border-gray-300 text-primary-600"
                                                />
                                                <span className="text-sm text-gray-700">{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Team ── */}
                    {activeTab === 'team' && (
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm">
                                    Invite Member
                                </button>
                            </div>

                            <div className="text-center py-8">
                                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-2 text-gray-500">Team management available on Pro plan and above</p>
                                <a
                                    href="/settings/subscription"
                                    className="mt-4 inline-block text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    Upgrade to Pro →
                                </a>
                            </div>
                        </div>
                    )}

                    {/* ── Categories ── */}
                    {activeTab === 'categories' && (
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">Product Categories</h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Manage the categories that appear when adding or editing products.
                                </p>
                            </div>

                            {/* Add category form */}
                            <form onSubmit={handleAddCategory} className="flex gap-3 mb-6">
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="New category name (e.g., Electronics)"
                                    className="flex-1 rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500 text-sm"
                                    maxLength={100}
                                />
                                <button
                                    type="submit"
                                    disabled={addingCategory || !newCategoryName.trim()}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    {addingCategory ? 'Adding…' : 'Add Category'}
                                </button>
                            </form>

                            {/* Category list */}
                            {categories.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                                    <TagIcon className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                                    <p className="text-gray-500 font-medium">No categories yet</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Add a category above to organize your products.
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                                    {categories.map((category) => (
                                        <li
                                            key={category.id}
                                            className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <TagIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                    {category.name}
                                                </span>
                                                {!category.is_active && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                                                        Hidden
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                                {/* Toggle active / hidden */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleActive(category)}
                                                    className={clsx(
                                                        'text-xs px-3 py-1 rounded-full font-medium border transition-colors',
                                                        category.is_active
                                                            ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                                                            : 'border-gray-200 text-gray-500 bg-gray-50 hover:bg-gray-100'
                                                    )}
                                                >
                                                    {category.is_active ? 'Active' : 'Hidden'}
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteCategory(category)}
                                                    disabled={deletingId === category.id}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                                                    title="Delete category"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <p className="mt-4 text-xs text-gray-400">
                                Note: Categories with existing products cannot be deleted.
                                Deactivate them instead to hide from the product form.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </TenantLayout>
    );
}
