import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import AdminLayout from '@/Layouts/AdminLayout';

interface Props {
    plans: Record<string, any>;
}

export default function CreateUser({ plans }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState(1);

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        business_name: '',
        business_type: '',
        slug: '',
        is_admin: false,
        is_active: true,
    });

    // Step 1 field keys — if validation errors exist here, go back to step 1
    const step1Fields = ['name', 'email', 'phone', 'password', 'password_confirmation'];

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/users', {
            onError: (formErrors) => {
                const hasStep1Errors = step1Fields.some((field) => field in formErrors);
                if (hasStep1Errors && step === 2) {
                    setStep(1);
                }
            },
        });
    }

    const generateSlug = (name: string) =>
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .substring(0, 30);

    const updateBusinessName = (name: string) => {
        setData({ ...data, business_name: name, slug: generateSlug(name) });
    };

    const businessCategories = [
        { key: 'retail', label: 'Retail / Store', icon: '🏪', description: 'Sari-sari, convenience, general goods' },
        { key: 'food', label: 'Food & Beverage', icon: '🍽️', description: 'Restaurant, cafe, bakery, food stall' },
        { key: 'services', label: 'Services', icon: '🔧', description: 'Repair, salon, laundry, printing' },
        { key: 'fashion', label: 'Fashion & Accessories', icon: '👜', description: 'Clothing, shoes, bags, jewelry' },
        { key: 'health', label: 'Health & Wellness', icon: '💊', description: 'Pharmacy, spa, fitness' },
        { key: 'others', label: 'Others', icon: '📦', description: 'Any other type of business' },
    ];

    const canProceedStep1 =
        data.name.trim() !== '' &&
        data.email.trim() !== '' &&
        data.password !== '' &&
        data.password === data.password_confirmation;

    const canSubmit = data.business_name !== '' && data.slug !== '' && data.business_type !== '';

    return (
        <AdminLayout title="Create User">
            <Head title="Create User - Admin" />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
                <Link href="/admin/users" className="hover:text-white/60 transition-colors">Users</Link>
                <span>/</span>
                <span className="text-white/70">Create</span>
            </div>

            <div className="max-w-2xl">
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">

                    {/* Header + step indicator */}
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white">
                            {step === 1 ? 'Account Details' : 'Business Information'}
                        </h2>
                        <p className="text-sm text-white/50 mt-1">
                            {step === 1
                                ? 'Personal credentials for the new user.'
                                : 'Business details for this account.'}
                        </p>
                        {/* Progress bar */}
                        <div className="mt-4 flex items-center gap-2">
                            <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? 'bg-indigo-500' : 'bg-white/10'}`} />
                            <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? 'bg-indigo-500' : 'bg-white/10'}`} />
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* ── STEP 1: Personal / Account info ─────────────────────── */}
                        {step === 1 && (
                            <>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-white/50 mb-1.5">Full Name *</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            placeholder="Juan dela Cruz"
                                            required
                                        />
                                        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/50 mb-1.5">Email *</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            placeholder="juan@example.com"
                                            required
                                        />
                                        {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs text-white/50 mb-1.5">Phone</label>
                                    <input
                                        type="tel"
                                        value={data.phone}
                                        onChange={e => setData('phone', e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        placeholder="09171234567"
                                    />
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-white/50 mb-1.5">Password *</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={data.password}
                                                onChange={e => setData('password', e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                placeholder="Minimum 8 characters"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white/70"
                                            >
                                                {showPassword
                                                    ? <EyeSlashIcon className="h-4 w-4" />
                                                    : <EyeIcon className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/50 mb-1.5">Confirm Password *</label>
                                        <input
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={e => setData('password_confirmation', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            placeholder="Repeat password"
                                            required
                                        />
                                        {data.password_confirmation && data.password !== data.password_confirmation && (
                                            <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                                        )}
                                    </div>
                                </div>

                                {/* Admin flag */}
                                <div className="flex flex-wrap gap-6 pt-1">
                                    <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={e => setData('is_active', e.target.checked)}
                                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/50"
                                        />
                                        Active
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={data.is_admin}
                                            onChange={e => setData('is_admin', e.target.checked)}
                                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-red-500 focus:ring-red-500/50"
                                        />
                                        Platform Admin
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                    <Link
                                        href="/admin/users"
                                        className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="button"
                                        disabled={!canProceedStep1}
                                        onClick={() => setStep(2)}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                                    >
                                        Continue →
                                    </button>
                                </div>
                            </>
                        )}

                        {/* ── STEP 2: Business info ─────────────────────────────── */}
                        {step === 2 && (
                            <>
                                <div>
                                    <label className="block text-xs text-white/50 mb-1.5">Business Name *</label>
                                    <input
                                        type="text"
                                        value={data.business_name}
                                        onChange={e => updateBusinessName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        placeholder="My Business Name"
                                        required
                                    />
                                    {errors.business_name && <p className="text-xs text-red-400 mt-1">{errors.business_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs text-white/50 mb-1.5">Store URL / Slug *</label>
                                    <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:ring-2 focus-within:ring-indigo-500/50">
                                        <input
                                            type="text"
                                            value={data.slug}
                                            onChange={e => setData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                            className="flex-1 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none"
                                            placeholder="my-store"
                                            required
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-white/40">Unique store identifier (letters, numbers, hyphens only)</p>
                                    {errors.slug && <p className="text-xs text-red-400 mt-1">{errors.slug}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs text-white/50 mb-2">Business Category *</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {businessCategories.map((cat) => (
                                            <button
                                                key={cat.key}
                                                type="button"
                                                onClick={() => setData('business_type', cat.key)}
                                                className={`p-3 rounded-xl border-2 text-left transition-colors ${data.business_type === cat.key
                                                        ? 'border-indigo-500 bg-indigo-500/10'
                                                        : 'border-white/10 bg-white/5 hover:border-white/20'
                                                    }`}
                                            >
                                                <span className="text-xl">{cat.icon}</span>
                                                <p className="mt-1 text-sm font-medium text-white">{cat.label}</p>
                                                <p className="text-xs text-white/40">{cat.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                    {errors.business_type && <p className="text-xs text-red-400 mt-1">{errors.business_type}</p>}
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                                    >
                                        ← Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || !canSubmit}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
                                    >
                                        {processing ? 'Creating...' : 'Create Account'}
                                    </button>
                                </div>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
