import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import appLogo from '@/../images/PadayON.png';

export default function ForgotPassword() {
    const { flash } = usePage<{ flash: { status?: string } }>().props as any;

    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <>
            <Head title="Forgot Password" />

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
                            <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Forgot your password?</h2>
                            <p className="text-gray-600 mt-2">
                                Enter your email address and we'll send you a verification code to reset your password.
                            </p>
                        </div>

                        {flash?.status && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <p className="text-sm text-green-700">{flash.status}</p>
                            </div>
                        )}

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

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Sending OTP...
                                    </span>
                                ) : (
                                    'Send Verification Code'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link
                                href="/login"
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                                ← Back to Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
