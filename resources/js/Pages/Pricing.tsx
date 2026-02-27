import React from 'react';
import { Head, Link } from '@inertiajs/react';
import appLogo from '@/../images/PadayON.png';
import { CheckIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

interface Plan {
    name: string;
    price: number | null;
    billing: string;
    description: string;
    features: string[];
    highlighted?: boolean;
    cta: string;
}

interface PricingProps {
    plans: Record<string, any>;
}

const defaultPlans: Plan[] = [
    {
        name: 'Free',
        price: 0,
        billing: 'forever',
        description: 'Perfect for getting started',
        features: ['Up to 50 products', 'Basic POS', 'Single user', 'Basic reports'],
        cta: 'Get Started',
    },
    {
        name: 'Starter',
        price: 499,
        billing: '/month',
        description: 'For growing businesses',
        features: ['Up to 500 products', 'Full POS + Barcode', '3 users', 'SMS reminders', 'Credit management', 'Inventory alerts'],
        cta: 'Start Trial',
    },
    {
        name: 'Pro',
        price: 999,
        billing: '/month',
        description: 'For established businesses',
        features: ['Unlimited products', 'Advanced analytics', '10 users', 'Website builder', 'E-loading & Bills', 'Priority support'],
        highlighted: true,
        cta: 'Start Trial',
    },
    {
        name: 'Business',
        price: 1999,
        billing: '/month',
        description: 'For multi-branch operations',
        features: ['Multi-branch', 'Unlimited users', 'API access', 'Custom domain', 'Dedicated support', 'Custom features'],
        cta: 'Contact Sales',
    },
];

export default function Pricing({ plans }: PricingProps) {
    return (
        <>
            <Head title="Pricing - PadayON" />

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex justify-between items-center">
                            <Link href="/" className="flex items-center">
                                <img src={appLogo} alt="PadayON" className="h-12 object-contain" />
                            </Link>
                            <nav className="hidden md:flex items-center gap-6">
                                <Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
                                <Link href="/pricing" className="text-primary-600 font-medium">Pricing</Link>
                                <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
                                <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
                                <Link href="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
                                <Link href="/register" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                                    Get Started
                                </Link>
                            </nav>
                        </div>
                    </div>
                </header>

                {/* Hero */}
                <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Simple, Transparent Pricing
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Start free and scale as you grow. No hidden fees. Cancel anytime.
                        </p>
                    </div>
                </section>

                {/* Pricing Cards */}
                <section className="py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {defaultPlans.map((plan, index) => (
                                <div
                                    key={index}
                                    className={clsx(
                                        'rounded-2xl p-8',
                                        plan.highlighted
                                            ? 'bg-primary-600 text-white ring-4 ring-primary-600 ring-offset-2'
                                            : 'bg-white shadow-sm'
                                    )}
                                >
                                    <h3 className={clsx(
                                        'text-lg font-semibold mb-2',
                                        plan.highlighted ? 'text-white' : 'text-gray-900'
                                    )}>
                                        {plan.name}
                                    </h3>
                                    <p className={clsx(
                                        'text-sm mb-4',
                                        plan.highlighted ? 'text-primary-100' : 'text-gray-500'
                                    )}>
                                        {plan.description}
                                    </p>
                                    <div className="mb-6">
                                        <span className={clsx(
                                            'text-4xl font-bold',
                                            plan.highlighted ? 'text-white' : 'text-gray-900'
                                        )}>
                                            {plan.price === 0 ? 'Free' : `₱${plan.price}`}
                                        </span>
                                        {plan.price !== 0 && (
                                            <span className={plan.highlighted ? 'text-primary-100' : 'text-gray-500'}>
                                                {plan.billing}
                                            </span>
                                        )}
                                    </div>
                                    <ul className="space-y-3 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <CheckIcon className={clsx(
                                                    'h-5 w-5 flex-shrink-0',
                                                    plan.highlighted ? 'text-primary-200' : 'text-primary-600'
                                                )} />
                                                <span className={clsx(
                                                    'text-sm',
                                                    plan.highlighted ? 'text-white' : 'text-gray-600'
                                                )}>
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link
                                        href="/register"
                                        className={clsx(
                                            'block w-full py-3 text-center font-semibold rounded-lg transition-colors',
                                            plan.highlighted
                                                ? 'bg-white text-primary-600 hover:bg-gray-100'
                                                : 'bg-primary-600 text-white hover:bg-primary-700'
                                        )}
                                    >
                                        {plan.cta}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="py-16 bg-white">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-gray-900">Is there a free trial?</h3>
                                <p className="text-gray-600 mt-1">Yes! All paid plans come with a 14-day free trial. No credit card required.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Can I switch plans later?</h3>
                                <p className="text-gray-600 mt-1">Absolutely. You can upgrade or downgrade at any time. Changes take effect immediately.</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">What payment methods do you accept?</h3>
                                <p className="text-gray-600 mt-1">We accept GCash, Maya, credit/debit cards, and bank transfers via PayMongo.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-100 py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
                        <p>© 2024 PadayON. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
