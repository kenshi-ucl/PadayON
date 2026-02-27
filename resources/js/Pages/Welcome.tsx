import React from 'react';
import { Head, Link } from '@inertiajs/react';
import appLogo from '@/../images/PadayON.png';
import {
    ShoppingCartIcon,
    CreditCardIcon,
    DevicePhoneMobileIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    GlobeAltIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';

interface Plan {
    name: string;
    price: number;
    price_formatted: string;
    billing_period: string;
    features: Record<string, any>;
}

interface Props {
    plans: Record<string, Plan>;
}

export default function Welcome({ plans }: Props) {
    const features = [
        {
            name: 'Point of Sale',
            description: 'Simple, fast POS system for any small business. Works on any device!',
            icon: ShoppingCartIcon,
        },
        {
            name: 'Credit Tracking (Utang)',
            description: 'Never lose track of customer credit. Send FREE SMS reminders.',
            icon: CreditCardIcon,
        },
        {
            name: 'Inventory Management',
            description: 'Track stock levels, get low-stock alerts, and manage product categories.',
            icon: ChartBarIcon,
        },
        {
            name: 'Customer Management',
            description: 'Build your suki list and track purchase history and preferences.',
            icon: UsersIcon,
        },
        {
            name: 'Mobile Ready',
            description: 'Access your business from any device. GCash & Maya integrated.',
            icon: DevicePhoneMobileIcon,
        },
        {
            name: 'Online Store',
            description: 'Create your own online store with customizable templates.',
            icon: GlobeAltIcon,
        },
    ];

    const businessExamples = [
        { icon: '🏪', name: 'Sari-Sari Stores', description: 'POS, inventory, and credit tracking' },
        { icon: '☕', name: 'Coffee Shops & Cafes', description: 'Menu management and order processing' },
        { icon: '👜', name: 'Retail & Fashion', description: 'Product catalog and sales reporting' },
        { icon: '💇', name: 'Salons & Spas', description: 'Customer bookings and service tracking' },
        { icon: '🍞', name: 'Bakeries & Food Stalls', description: 'Inventory and daily sales monitoring' },
        { icon: '🔧', name: 'Repair & Services', description: 'Job tracking and customer management' },
    ];

    return (
        <>
            <Head title="PadayON - The All-in-One Platform for Filipino Small Businesses" />

            <div className="bg-white">
                {/* Navigation */}
                <header className="absolute inset-x-0 top-0 z-50">
                    <nav className="flex items-center justify-between p-6 lg:px-8 max-w-7xl mx-auto">
                        <div className="flex lg:flex-1">
                            <Link href="/" className="-m-1.5 p-1.5 flex items-center">
                                <img src={appLogo} alt="PadayON" className="h-12 object-contain" />
                            </Link>
                        </div>
                        <div className="hidden lg:flex lg:gap-x-8">
                            <Link href="/features" className="text-sm font-semibold text-gray-900 hover:text-primary-600">
                                Features
                            </Link>
                            <Link href="/pricing" className="text-sm font-semibold text-gray-900 hover:text-primary-600">
                                Pricing
                            </Link>
                        </div>
                        <div className="flex flex-1 justify-end gap-4">
                            <Link
                                href="/login"
                                className="text-sm font-semibold text-gray-900 hover:text-primary-600"
                            >
                                Log in
                            </Link>
                            <Link
                                href="/register"
                                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"
                            >
                                Start Free
                            </Link>
                        </div>
                    </nav>
                </header>

                {/* Hero Section */}
                <div className="relative isolate pt-14">
                    <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                        <div
                            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-200 to-secondary-200 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
                            style={{
                                clipPath:
                                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                            }}
                        />
                    </div>

                    <div className="py-24 sm:py-32">
                        <div className="mx-auto max-w-7xl px-6 lg:px-8">
                            <div className="mx-auto max-w-3xl text-center">
                                <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                                    Ang Digital Partner ng{' '}
                                    <span className="text-primary-600">Negosyante</span>
                                </h1>
                                <p className="mt-6 text-lg leading-8 text-gray-600">
                                    PadayON is the all-in-one platform for Filipino small businesses.
                                    POS, inventory, customer management, and more — accept GCash & Maya,
                                    track utang, and grow your business starting at ₱0/month.
                                </p>
                                <div className="mt-10 flex items-center justify-center gap-x-6">
                                    <Link
                                        href="/register"
                                        className="rounded-xl bg-primary-600 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:bg-primary-700 flex items-center gap-2"
                                    >
                                        Simulan ang Free Trial
                                        <ArrowRightIcon className="h-5 w-5" />
                                    </Link>
                                    <Link
                                        href="/features"
                                        className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                                    >
                                        Tingnan ang Features →
                                    </Link>
                                </div>
                            </div>

                            {/* Screenshot placeholder */}
                            <div className="mt-16 flow-root sm:mt-24">
                                <div className="rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4">
                                    <div className="rounded-lg bg-white shadow-2xl ring-1 ring-gray-900/10">
                                        <div className="p-8 text-center">
                                            <p className="text-gray-500">Dashboard Preview</p>
                                            <div className="mt-4 grid grid-cols-3 gap-4">
                                                <div className="bg-primary-50 rounded-lg p-4">
                                                    <p className="text-2xl font-bold text-primary-600">₱12,450</p>
                                                    <p className="text-sm text-gray-600">Today's Sales</p>
                                                </div>
                                                <div className="bg-secondary-50 rounded-lg p-4">
                                                    <p className="text-2xl font-bold text-secondary-600">47</p>
                                                    <p className="text-sm text-gray-600">Orders</p>
                                                </div>
                                                <div className="bg-amber-50 rounded-lg p-4">
                                                    <p className="text-2xl font-bold text-amber-600">₱8,200</p>
                                                    <p className="text-sm text-gray-600">Total Utang</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Business Types */}
                <div className="py-24 bg-gray-50">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                Para sa Bawat Uri ng Negosyo
                            </h2>
                            <p className="mt-4 text-lg text-gray-600">
                                Whatever business you run — PadayON has the tools you need to manage, grow, and succeed.
                            </p>
                        </div>

                        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {businessExamples.map((biz, index) => (
                                <div key={index} className="relative rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-200">
                                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                                        <span className="text-2xl">{biz.icon}</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900">{biz.name}</h3>
                                    <p className="mt-2 text-gray-600">{biz.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="py-24">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                Everything You Need to Succeed
                            </h2>
                            <p className="mt-4 text-lg text-gray-600">
                                Built specifically for Filipino small businesses. GCash, Maya, and local payment methods included.
                            </p>
                        </div>

                        <div className="mx-auto mt-16 max-w-5xl">
                            <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                                {features.map((feature) => (
                                    <div key={feature.name} className="relative pl-16">
                                        <dt className="text-base font-semibold text-gray-900">
                                            <div className="absolute left-0 top-0 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
                                                <feature.icon className="h-6 w-6 text-white" />
                                            </div>
                                            {feature.name}
                                        </dt>
                                        <dd className="mt-2 text-sm text-gray-600">{feature.description}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="py-24 bg-gray-50" id="pricing">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                Simple, Affordable Pricing
                            </h2>
                            <p className="mt-4 text-lg text-gray-600">
                                Start free forever. Upgrade when you're ready to grow.
                            </p>
                        </div>

                        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                            {Object.entries(plans).map(([key, plan]) => (
                                <div
                                    key={key}
                                    className={`rounded-2xl p-8 ${key === 'pro'
                                        ? 'bg-primary-600 text-white ring-4 ring-primary-600'
                                        : 'bg-white ring-1 ring-gray-200'
                                        }`}
                                >
                                    <h3
                                        className={`text-lg font-semibold ${key === 'pro' ? 'text-white' : 'text-gray-900'
                                            }`}
                                    >
                                        {plan.name}
                                    </h3>
                                    <p className="mt-4 flex items-baseline gap-x-1">
                                        <span
                                            className={`text-4xl font-bold ${key === 'pro' ? 'text-white' : 'text-gray-900'
                                                }`}
                                        >
                                            {plan.price_formatted}
                                        </span>
                                        <span
                                            className={`text-sm ${key === 'pro' ? 'text-primary-200' : 'text-gray-500'}`}
                                        >
                                            /{plan.billing_period === 'forever' ? 'forever' : 'month'}
                                        </span>
                                    </p>
                                    <Link
                                        href="/register"
                                        className={`mt-6 block w-full rounded-lg py-2 text-center text-sm font-semibold ${key === 'pro'
                                            ? 'bg-white text-primary-600 hover:bg-gray-100'
                                            : 'bg-primary-600 text-white hover:bg-primary-700'
                                            }`}
                                    >
                                        {plan.price === 0 ? 'Start Free' : 'Get Started'}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="py-24">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                                Simulan ang Iyong Digital Journey
                            </h2>
                            <p className="mt-4 text-lg text-gray-600">
                                Join thousands of Filipino entrepreneurs using PadayON to grow their business.
                            </p>
                            <div className="mt-10">
                                <Link
                                    href="/register"
                                    className="rounded-xl bg-primary-600 px-8 py-4 text-lg font-semibold text-white shadow-lg hover:bg-primary-700"
                                >
                                    Mag-register Ngayon — Libre!
                                </Link>
                            </div>
                            <p className="mt-4 text-sm text-gray-500">
                                14-day free trial • No credit card required • Cancel anytime
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="bg-gray-900 py-12">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <div className="flex items-center">
                                <img src={appLogo} alt="PadayON" className="h-8 object-contain brightness-0 invert" />
                            </div>
                            <p className="mt-4 md:mt-0 text-sm text-gray-400">
                                © {new Date().getFullYear()} PadayON by CantiumCode. Made with 💙 in the Philippines.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
