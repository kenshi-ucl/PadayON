import React, { useState, FormEvent } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps } from '@/types';
import {
    ArrowLeftIcon,
    UserGroupIcon,
    CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface CustomerCreateProps extends PageProps {
    defaultCreditLimit: number;
}

export default function CustomerCreate({ defaultCreditLimit }: CustomerCreateProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        is_suki: false,
        credit_enabled: false,
        credit_limit: defaultCreditLimit.toString(),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error('Please enter a customer name');
            return;
        }

        setIsSubmitting(true);

        router.post('/customers', {
            ...formData,
            credit_limit: formData.credit_enabled ? parseFloat(formData.credit_limit) : 0,
        }, {
            onSuccess: () => {
                toast.success('Customer created successfully!');
            },
            onError: (errors) => {
                toast.error(Object.values(errors)[0] as string || 'Failed to create customer');
            },
            onFinish: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <TenantLayout title="Add Customer">
            <Head title="Add Customer" />

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/customers" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                    <ArrowLeftIcon className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
                    <p className="text-gray-500">Create a new customer profile</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl">
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <UserGroupIcon className="h-5 w-5 text-primary-600" />
                            Customer Information
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g., Juan dela Cruz"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="09XX XXX XXXX"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Optional"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Optional"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="Any additional notes about this customer"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Customer Type */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Type</h2>
                        <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                                type="checkbox"
                                name="is_suki"
                                checked={formData.is_suki}
                                onChange={handleChange}
                                className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-5 w-5"
                            />
                            <div>
                                <p className="font-medium text-gray-900">⭐ Suki Customer</p>
                                <p className="text-sm text-gray-500">Mark as a loyal/regular customer</p>
                            </div>
                        </label>
                    </div>

                    {/* Credit (Utang) Settings */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CurrencyDollarIcon className="h-5 w-5 text-primary-600" />
                            Credit (Utang) Settings
                        </h2>
                        <div className="space-y-4">
                            <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="checkbox"
                                    name="credit_enabled"
                                    checked={formData.credit_enabled}
                                    onChange={handleChange}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-5 w-5"
                                />
                                <div>
                                    <p className="font-medium text-gray-900">Enable Credit</p>
                                    <p className="text-sm text-gray-500">Allow this customer to purchase on credit</p>
                                </div>
                            </label>

                            {formData.credit_enabled && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
                                    <div className="relative max-w-xs">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                                        <input
                                            type="number"
                                            name="credit_limit"
                                            value={formData.credit_limit}
                                            onChange={handleChange}
                                            min="0"
                                            step="100"
                                            className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Maximum amount this customer can owe</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex gap-4">
                        <Link
                            href="/customers"
                            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-gray-300"
                        >
                            {isSubmitting ? 'Creating...' : 'Create Customer'}
                        </button>
                    </div>
                </div>
            </form>
        </TenantLayout>
    );
}
