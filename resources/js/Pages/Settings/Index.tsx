import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, Tenant } from '@/types';
import {
    BuildingStorefrontIcon,
    CreditCardIcon,
    BellIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
    Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface SettingsProps extends PageProps {
    tenant: Tenant;
}

type TabType = 'business' | 'payment' | 'notifications' | 'team';

export default function SettingsIndex({ tenant }: SettingsProps) {
    const [activeTab, setActiveTab] = useState<TabType>('business');

    const businessForm = useForm({
        business_name: tenant.business_name || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        business_address: tenant.business_address || '',
        city: tenant.city || '',
        province: tenant.province || '',
    });

    const paymentForm = useForm({
        gcash_enabled: tenant.gcash_enabled,
        maya_enabled: tenant.maya_enabled,
        card_enabled: tenant.card_enabled,
        cod_enabled: tenant.cod_enabled,
    });

    const tabs = [
        { id: 'business' as TabType, name: 'Business', icon: BuildingStorefrontIcon },
        { id: 'payment' as TabType, name: 'Payment', icon: CreditCardIcon },
        { id: 'notifications' as TabType, name: 'Notifications', icon: BellIcon },
        { id: 'team' as TabType, name: 'Team', icon: UserGroupIcon },
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
                </div>
            </div>
        </TenantLayout>
    );
}
