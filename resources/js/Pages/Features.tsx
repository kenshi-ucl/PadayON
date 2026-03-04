import React from 'react';
import { Head, Link } from '@inertiajs/react';
import LandingLayout from '@/Layouts/LandingLayout';
import {
    DevicePhoneMobileIcon,
    CreditCardIcon,
    ChartBarIcon,
    UsersIcon,
    ClockIcon,
    BoltIcon,
    CloudIcon,
    ShieldCheckIcon,
    GlobeAltIcon,
    ChatBubbleLeftRightIcon,
    BanknotesIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

interface FeatureItem {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
}

const coreFeatures: FeatureItem[] = [
    { icon: BoltIcon, title: 'Fast POS System', description: 'Process sales in seconds with barcode scanning and quick product search. Works on any device.' },
    { icon: CreditCardIcon, title: 'GCash & Maya Ready', description: 'Accept digital payments alongside cash. Automatic payment reconciliation.' },
    { icon: UsersIcon, title: 'Customer Management', description: 'Build your suki list, track purchase history, and manage customer relationships.' },
    { icon: BanknotesIcon, title: 'Credit (Utang) Tracking', description: 'Track customer credit with automatic balance updates and SMS payment reminders.' },
    { icon: ChartBarIcon, title: 'Inventory Management', description: 'Track stock levels, get low-stock alerts, and manage product categories.' },
    { icon: SparklesIcon, title: 'Flexible Pricing', description: 'Support tingi (per-piece) pricing, wholesale rates, and custom discounts.' },
    { icon: CloudIcon, title: 'Cloud-Based', description: 'Access your business data from any device. No software to install or update.' },
    { icon: DevicePhoneMobileIcon, title: 'Mobile Friendly', description: 'Fully responsive design works on phones, tablets, and desktop computers.' },
    { icon: ChatBubbleLeftRightIcon, title: 'SMS Notifications', description: 'Send automated order updates, payment reminders, and promotional messages.' },
    { icon: GlobeAltIcon, title: 'Online Store', description: 'Create your own online store with customizable templates and free subdomain.' },
    { icon: ClockIcon, title: 'Real-Time Reports', description: 'Daily, weekly, and monthly sales reports with revenue charts and insights.' },
    { icon: ShieldCheckIcon, title: 'Secure & Reliable', description: 'Bank-level security with automated backups. Your data is always safe.' },
];

export default function Features() {
    return (
        <LandingLayout>
            <Head title="Features - PadayON" />

            {/* Hero */}
            <div className="bg-gradient-to-br from-primary-600 to-secondary-600 py-20">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <h1 className="text-4xl sm:text-5xl font-bold text-white">
                        Everything your business needs to grow
                    </h1>
                    <p className="mt-6 text-xl text-white/80 max-w-2xl mx-auto">
                        From POS to inventory, customer management to online store —
                        PadayON has all the tools Filipino small businesses need.
                    </p>
                </div>
            </div>

            {/* Features Grid */}
            <div className="max-w-7xl mx-auto px-4 py-20">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Powerful features for any business
                    </h2>
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                        Whether you run a sari-sari store, restaurant, salon, or any other business —
                        PadayON adapts to your needs.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {coreFeatures.map((feature, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                                <feature.icon className="h-6 w-6 text-primary-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                            <p className="mt-2 text-gray-600">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="bg-gray-50 py-16">
                <div className="max-w-4xl mx-auto text-center px-4">
                    <h2 className="text-3xl font-bold text-gray-900">
                        Ready to grow your business?
                    </h2>
                    <p className="mt-4 text-lg text-gray-600">
                        Join thousands of Filipino entrepreneurs using PadayON. Start free, upgrade anytime.
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <Link href="/login" className="bg-primary-600 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-primary-700">
                            Sign In to Dashboard
                        </Link>
                        <Link href="/pricing" className="bg-white text-gray-900 px-8 py-3 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50">
                            View Pricing
                        </Link>
                    </div>
                </div>
            </div>
        </LandingLayout>
    );
}
