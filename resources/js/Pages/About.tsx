import React from 'react';
import { Head, Link } from '@inertiajs/react';
import appLogo from '@/../images/PadayON.png';
import {
    HeartIcon,
    LightBulbIcon,
    UserGroupIcon,
    GlobeAsiaAustraliaIcon,
} from '@heroicons/react/24/outline';

export default function About() {
    const values = [
        {
            icon: HeartIcon,
            title: 'Filipino-First',
            description: 'Built by Filipinos, for Filipino businesses. We understand the unique challenges of running a tindahan, labahan, or catering business.',
        },
        {
            icon: LightBulbIcon,
            title: 'Simple Yet Powerful',
            description: 'No complicated setup. Get started in minutes, not days. Our tools are intuitive even if you\'re not tech-savvy.',
        },
        {
            icon: UserGroupIcon,
            title: 'Community-Driven',
            description: 'We listen to our users. Many features come directly from feedback from sari-sari store owners across the Philippines.',
        },
        {
            icon: GlobeAsiaAustraliaIcon,
            title: 'Local Support',
            description: 'Our support team is based in the Philippines and available during Philippine business hours. We speak Tagalog!',
        },
    ];

    return (
        <>
            <Head title="About - PadayON" />

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
                                <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
                                <Link href="/about" className="text-primary-600 font-medium">About</Link>
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
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Empowering Filipino Entrepreneurs
                        </h1>
                        <p className="text-xl text-gray-600 leading-relaxed">
                            PadayON was born from a simple observation: millions of small businesses in the Philippines
                            still rely on manual record-keeping. We're on a mission to change that by providing
                            affordable, easy-to-use digital tools.
                        </p>
                    </div>
                </section>

                {/* Story */}
                <section className="py-16">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
                            <div className="prose prose-lg text-gray-600">
                                <p>
                                    Growing up in a family that ran a sari-sari store, we saw firsthand the challenges
                                    of managing inventory, tracking "utang," and keeping up with daily sales records
                                    using notebooks and calculators.
                                </p>
                                <p className="mt-4">
                                    We built PadayON to solve these problems. What started as a simple POS system
                                    has grown into a complete business management platform serving thousands of
                                    micro-entrepreneurs across the Philippines.
                                </p>
                                <p className="mt-4">
                                    Today, PadayON helps sari-sari stores, laundry shops, and catering businesses
                                    manage their operations more efficiently, giving business owners more time to
                                    focus on what matters most—their customers and families.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values */}
                <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {values.map((value, index) => (
                                <div key={index} className="text-center">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                                        <value.icon className="h-8 w-8 text-primary-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                                    <p className="text-gray-600">{value.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats */}
                <section className="py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-3 gap-8 text-center">
                            <div className="bg-white rounded-xl shadow-sm p-8">
                                <p className="text-4xl font-bold text-primary-600">10,000+</p>
                                <p className="text-gray-600 mt-2">Businesses Served</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-8">
                                <p className="text-4xl font-bold text-primary-600">₱100M+</p>
                                <p className="text-gray-600 mt-2">Transactions Processed</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-8">
                                <p className="text-4xl font-bold text-primary-600">81</p>
                                <p className="text-gray-600 mt-2">Provinces Reached</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-16 bg-primary-600 text-white">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-bold mb-4">Join thousands of Filipino entrepreneurs</h2>
                        <p className="text-primary-100 mb-8">Start your free trial today and see the difference.</p>
                        <Link href="/register" className="inline-block px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100">
                            Get Started Free
                        </Link>
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
