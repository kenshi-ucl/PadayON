import React from 'react';
import { Head, Link } from '@inertiajs/react';

interface TenantDashboardProps {
    tenant: {
        id: string;
        name: string;
        slug: string;
        business_type: string;
        plan: string;
    };
    user: {
        id: number;
        name: string;
        email: string;
        is_owner: boolean;
    };
}

export default function Dashboard({ tenant, user }: TenantDashboardProps) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <nav className="bg-white/10 backdrop-blur-md border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <h1 className="text-xl font-bold text-white">
                                    {tenant?.name || 'PadayON'}
                                </h1>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-white/70">{user?.name}</span>
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                                >
                                    Logout
                                </Link>
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h2 className="text-4xl font-bold text-white mb-4">
                            🎉 Welcome to Your Dashboard!
                        </h2>
                        <p className="text-xl text-white/70 mb-8">
                            You've successfully logged in as a tenant user.
                        </p>

                        <div className="grid md:grid-cols-3 gap-6 mt-12">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-2">Business</h3>
                                <p className="text-white/70">{tenant?.name}</p>
                                <p className="text-sm text-white/50 capitalize">{tenant?.business_type?.replace('_', ' ')}</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-2">Plan</h3>
                                <p className="text-white/70 capitalize">{tenant?.plan}</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-2">User</h3>
                                <p className="text-white/70">{user?.email}</p>
                                <p className="text-sm text-white/50">{user?.is_owner ? 'Owner' : 'Staff'}</p>
                            </div>
                        </div>

                        <div className="mt-12 p-6 bg-amber-500/20 border border-amber-500/30 rounded-2xl">
                            <h3 className="text-lg font-semibold text-amber-200 mb-2">
                                ⚠️ Local Development Mode
                            </h3>
                            <p className="text-amber-100/80">
                                You're viewing this dashboard from the central domain. In production,
                                tenant users would be redirected to their subdomain (e.g., {tenant?.slug}.PadayON.ph).
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
