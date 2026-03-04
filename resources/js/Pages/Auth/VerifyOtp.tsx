import React, { useRef, useState, useEffect } from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import appLogo from '@/../images/PadayON.png';

interface Props {
    email: string;
}

export default function VerifyOtp({ email }: Props) {
    const { flash } = usePage<{ flash: { status?: string } }>().props as any;
    const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const { data, setData, post, processing, errors } = useForm({
        email: email,
        otp: '',
    });

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleDigitChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newDigits = [...otpDigits];
        newDigits[index] = value;
        setOtpDigits(newDigits);

        // Update the combined OTP value
        const combinedOtp = newDigits.join('');
        setData('otp', combinedOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length === 0) return;

        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
            newDigits[i] = pasted[i] || '';
        }
        setOtpDigits(newDigits);
        setData('otp', newDigits.join(''));

        // Focus the last filled input or the next empty one
        const focusIndex = Math.min(pasted.length, 5);
        inputRefs.current[focusIndex]?.focus();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const otp = otpDigits.join('');
        if (otp.length !== 6) return;
        setData('otp', otp);
        post('/verify-otp');
    };

    // Because setData is async, we need to submit with the current otpDigits
    useEffect(() => {
        // Keep data.otp in sync
        setData('otp', otpDigits.join(''));
    }, [otpDigits]);

    const handleResend = () => {
        setResending(true);
        router.post('/resend-otp', { email }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => {
                setResending(false);
                setCountdown(60);
            },
        });
    };

    // Mask email for display
    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => {
        return a + '*'.repeat(Math.max(b.length, 1)) + c;
    });

    return (
        <>
            <Head title="Verify OTP" />

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
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
                            <p className="text-gray-600 mt-2">
                                We sent a 6-digit verification code to<br />
                                <span className="font-semibold text-gray-800">{maskedEmail}</span>
                            </p>
                        </div>

                        {flash?.status && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <p className="text-sm text-green-700">{flash.status}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                                    Enter verification code
                                </label>
                                <div className="flex gap-3 justify-center" onPaste={handlePaste}>
                                    {otpDigits.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => { inputRefs.current[index] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleDigitChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                                                errors.otp ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                            }`}
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                                {errors.otp && (
                                    <p className="mt-2 text-sm text-red-600 text-center">{errors.otp}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing || otpDigits.join('').length !== 6}
                                className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Verifying...
                                    </span>
                                ) : (
                                    'Verify Code'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Didn't receive the code?{' '}
                                {countdown > 0 ? (
                                    <span className="text-gray-400">Resend in {countdown}s</span>
                                ) : (
                                    <button
                                        onClick={handleResend}
                                        disabled={resending}
                                        className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                                    >
                                        {resending ? 'Sending...' : 'Resend Code'}
                                    </button>
                                )}
                            </p>
                        </div>

                        <div className="mt-4 text-center">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                ← Use a different email
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
