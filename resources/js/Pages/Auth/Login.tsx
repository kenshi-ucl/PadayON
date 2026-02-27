import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import appLogo from '@/../images/PadayON.png';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Login" />

            <div className="min-h-screen flex flex-col md:flex-row">
                {/* Left side - Brand */}
                <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-between">
                    <div>
                        <Link href="/" className="flex items-center">
                            <img src={appLogo} alt="PadayON" className="h-12 object-contain" />
                        </Link>
                    </div>

                    <div>
                        <h1 className="text-4xl font-bold text-white mb-4">
                            Kasama mo sa tagumpay
                        </h1>
                        <p className="text-primary-100 text-lg">
                            The all-in-one platform for sari-sari stores, laundry shops, and food catering businesses in the Philippines.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 text-primary-200 text-sm">
                        <span>© 2024 CantiumCode</span>
                        <span>•</span>
                        <a href="#" className="hover:text-white">Privacy</a>
                        <span>•</span>
                        <a href="#" className="hover:text-white">Terms</a>
                    </div>
                </div>

                {/* Right side - Form */}
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="w-full max-w-md">
                        {/* Mobile logo */}
                        <div className="md:hidden mb-8 text-center">
                            <Link href="/" className="inline-flex items-center">
                                <img src={appLogo} alt="PadayON" className="h-12 object-contain" />
                            </Link>
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
                            <p className="text-gray-600 mt-2">Sign in to your account to continue</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="you@example.com"
                                    required
                                    autoFocus
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="••••••••"
                                    required
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                                </label>

                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-primary-600 hover:text-primary-700"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {processing ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>

                        <div className="mt-8">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">New to PadayON?</span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Link
                                    href="/register"
                                    className="w-full flex justify-center py-3 px-4 border-2 border-primary-600 text-primary-600 font-semibold rounded-xl hover:bg-primary-50 transition-colors"
                                >
                                    Create an account
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
