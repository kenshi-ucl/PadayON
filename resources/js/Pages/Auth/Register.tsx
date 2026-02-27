import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import appLogo from '@/../images/PadayON.png';

interface Plan {
    name: string;
    price: number;
    price_formatted: string;
    features: Record<string, any>;
}

interface Props {
    plans: Record<string, Plan>;
}

export default function Register({ plans }: Props) {
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
    });

    // Step 1 field keys — if validation errors exist for these, redirect user back to step 1
    const step1Fields = ['name', 'email', 'phone', 'password', 'password_confirmation'];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register', {
            onError: (formErrors) => {
                // If there are errors in step 1 fields, go back to step 1
                const hasStep1Errors = step1Fields.some((field) => field in formErrors);
                if (hasStep1Errors && step === 2) {
                    setStep(1);
                }
            },
        });
    };

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')
            .substring(0, 30);
    };

    const updateBusinessName = (name: string) => {
        setData({
            ...data,
            business_name: name,
            slug: generateSlug(name),
        });
    };

    const businessCategories = [
        { key: 'retail', label: 'Retail / Store', icon: '🏪', description: 'Sari-sari, convenience, general goods' },
        { key: 'food', label: 'Food & Beverage', icon: '🍽️', description: 'Restaurant, cafe, bakery, food stall' },
        { key: 'services', label: 'Services', icon: '🔧', description: 'Repair, salon, laundry, printing' },
        { key: 'fashion', label: 'Fashion & Accessories', icon: '👜', description: 'Clothing, shoes, bags, jewelry' },
        { key: 'health', label: 'Health & Wellness', icon: '💊', description: 'Pharmacy, spa, fitness' },
        { key: 'others', label: 'Others', icon: '📦', description: 'Any other type of business' },
    ];

    return (
        <>
            <Head title="Create Your Account - PadayON" />

            <div className="min-h-screen bg-gray-50 flex">
                {/* Left side - Form */}
                <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24">
                    <div className="mx-auto w-full max-w-md">
                        <div className="flex items-center mb-8">
                            <Link href="/" className="flex items-center">
                                <img src={appLogo} alt="PadayON" className="h-12 object-contain" />
                            </Link>
                        </div>

                        <h2 className="text-3xl font-bold text-gray-900">
                            {step === 1 ? 'Create your account' : 'Set up your business'}
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            {step === 1
                                ? 'Start your 14-day free trial. No credit card required.'
                                : 'Tell us about your business to get started.'}
                        </p>

                        {/* Progress indicator */}
                        <div className="mt-6 flex items-center gap-2">
                            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-primary-600' : 'bg-gray-200'}`} />
                            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />
                        </div>

                        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                            {/* Global error banner — shows all validation errors regardless of step */}


                            {step === 1 && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                            placeholder="Juan dela Cruz"
                                            required
                                        />
                                        {errors.name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                            placeholder="juan@email.com"
                                            required
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Mobile Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                            placeholder="09171234567"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Password
                                        </label>
                                        <div className="relative mt-1">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 pr-10"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            >
                                                {showPassword ? (
                                                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                                                ) : (
                                                    <EyeIcon className="h-5 w-5 text-gray-400" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        disabled={!data.name || !data.email || !data.password || data.password !== data.password_confirmation}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Continue
                                    </button>
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Business Name
                                        </label>
                                        <input
                                            type="text"
                                            value={data.business_name}
                                            onChange={(e) => updateBusinessName(e.target.value)}
                                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                            placeholder="My Business Name"
                                            required
                                        />
                                        {errors.business_name && (
                                            <p className="mt-1 text-sm text-red-600">{errors.business_name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Store URL
                                        </label>
                                        <div className="mt-1 flex rounded-lg shadow-sm">
                                            <input
                                                type="text"
                                                value={data.slug}
                                                onChange={(e) => setData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                                className="flex-1 block w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                                                placeholder="my-store"
                                                required
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-gray-500">This will be your unique store identifier</p>
                                        {errors.slug && (
                                            <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Business Category
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {businessCategories.map((cat) => (
                                                <button
                                                    key={cat.key}
                                                    type="button"
                                                    onClick={() => setData('business_type', cat.key)}
                                                    className={`p-4 rounded-lg border-2 text-left ${data.business_type === cat.key
                                                        ? 'border-primary-600 bg-primary-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <span className="text-2xl">{cat.icon}</span>
                                                    <p className="mt-2 font-medium text-gray-900">{cat.label}</p>
                                                    <p className="text-xs text-gray-500">{cat.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                        {errors.business_type && (
                                            <p className="mt-1 text-sm text-red-600">{errors.business_type}</p>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing || !data.business_name || !data.slug || !data.business_type}
                                            className="flex-1 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {processing ? 'Creating...' : 'Create Account'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>

                        <p className="mt-8 text-center text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Right side - Info */}
                <div className="hidden lg:block relative w-0 flex-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center p-12">
                        <div className="max-w-md text-white">
                            <h3 className="text-2xl font-bold mb-6">
                                Join thousands of Filipino entrepreneurs
                            </h3>
                            <div className="space-y-4">
                                {[
                                    'Free forever plan for small businesses',
                                    'Accept GCash, Maya, and card payments',
                                    'Track customer credit (utang) easily',
                                    'Send FREE SMS payment reminders',
                                    'Access from any device, anywhere',
                                    'Local support, Tagalog available',
                                ].map((feature, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <CheckCircleIcon className="h-6 w-6 text-white/80" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-12 p-6 bg-white/10 rounded-xl backdrop-blur">
                                <p className="italic">
                                    "PadayON changed how I run my business. I can now track all my orders and
                                    payments from my phone!"
                                </p>
                                <p className="mt-4 font-medium">— Maria Santos, Quezon City</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
