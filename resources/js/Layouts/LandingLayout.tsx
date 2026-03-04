import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import appLogo from '@/../images/PadayON.png';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface LandingLayoutProps {
    children: React.ReactNode;
}

const navLinks = [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
];

export default function LandingLayout({ children }: LandingLayoutProps) {
    const { url } = usePage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === '/') return url === '/';
        return url.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <Link href="/" className="flex items-center">
                            <img src={appLogo} alt="PadayON" className="h-12 object-contain" />
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={
                                        isActive(link.href)
                                            ? 'text-sm font-semibold text-primary-600'
                                            : 'text-sm font-medium text-gray-600 hover:text-gray-900'
                                    }
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link
                                href="/login"
                                className="text-sm font-medium text-gray-600 hover:text-gray-900"
                            >
                                Login
                            </Link>
                        </nav>

                        {/* Mobile menu button */}
                        <button
                            type="button"
                            className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <span className="sr-only">Open menu</span>
                            {mobileMenuOpen ? (
                                <XMarkIcon className="h-6 w-6" />
                            ) : (
                                <Bars3Icon className="h-6 w-6" />
                            )}
                        </button>
                    </div>

                    {/* Mobile Nav */}
                    {mobileMenuOpen && (
                        <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
                            <div className="flex flex-col gap-3">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={
                                            isActive(link.href)
                                                ? 'text-sm font-semibold text-primary-600'
                                                : 'text-sm font-medium text-gray-600 hover:text-gray-900'
                                        }
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                                <Link
                                    href="/login"
                                    className="text-sm font-medium text-gray-600 hover:text-gray-900"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Login
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-gray-900 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Brand */}
                        <div className="md:col-span-1">
                            <img src={appLogo} alt="PadayON" className="h-10 object-contain brightness-0 invert" />
                            <p className="mt-4 text-sm text-gray-400">
                                The all-in-one platform for Filipino small businesses.
                            </p>
                        </div>

                        {/* Product */}
                        <div>
                            <h3 className="text-sm font-semibold text-white mb-4">Product</h3>
                            <ul className="space-y-2">
                                <li><Link href="/features" className="text-sm text-gray-400 hover:text-white">Features</Link></li>
                                <li><Link href="/pricing" className="text-sm text-gray-400 hover:text-white">Pricing</Link></li>
                                <li><Link href="/login" className="text-sm text-gray-400 hover:text-white">Login</Link></li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <h3 className="text-sm font-semibold text-white mb-4">Company</h3>
                            <ul className="space-y-2">
                                <li><Link href="/about" className="text-sm text-gray-400 hover:text-white">About</Link></li>
                                <li><Link href="/contact" className="text-sm text-gray-400 hover:text-white">Contact</Link></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="text-sm font-semibold text-white mb-4">Contact Us</h3>
                            <ul className="space-y-2">
                                <li className="text-sm text-gray-400">support@PadayON.ph</li>
                                <li className="text-sm text-gray-400">+63 917 123 4567</li>
                                <li className="text-sm text-gray-400">BGC, Taguig City, Philippines</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-sm text-gray-400">
                            &copy; {new Date().getFullYear()} PadayON by CantiumCode. Made with &#x1F499; in the Philippines.
                        </p>
                        <div className="mt-4 md:mt-0 flex gap-6">
                            <Link href="/features" className="text-sm text-gray-400 hover:text-white">Features</Link>
                            <Link href="/pricing" className="text-sm text-gray-400 hover:text-white">Pricing</Link>
                            <Link href="/about" className="text-sm text-gray-400 hover:text-white">About</Link>
                            <Link href="/contact" className="text-sm text-gray-400 hover:text-white">Contact</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
