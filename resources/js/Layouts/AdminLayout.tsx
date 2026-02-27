import React, { useState, PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    Bars3Icon,
    XMarkIcon,
    HomeIcon,
    UsersIcon,
    BuildingStorefrontIcon,
    ArrowRightOnRectangleIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';

interface AdminLayoutProps extends PropsWithChildren {
    title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
    const { auth, flash } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const currentPath = window.location.pathname;

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: HomeIcon, current: currentPath === '/admin' },
        { name: 'Users', href: '/admin/users', icon: UsersIcon, current: currentPath.startsWith('/admin/users') },
        { name: 'Tenants', href: '/admin/tenants', icon: BuildingStorefrontIcon, current: currentPath.startsWith('/admin/tenants') },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-slate-900 border-r border-white/10">
                        <div className="flex h-16 items-center justify-between px-6 border-b border-white/10">
                            <span className="text-xl font-bold text-white">🛡️ PadayON Admin</span>
                            <button onClick={() => setSidebarOpen(false)}>
                                <XMarkIcon className="h-6 w-6 text-white/60" />
                            </button>
                        </div>
                        <nav className="flex-1 overflow-y-auto px-4 py-4">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium mb-1 transition-all ${item.current
                                            ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900/80 backdrop-blur-xl border-r border-white/10 px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center">
                        <Link href="/admin" className="flex items-center gap-2">
                            <span className="text-2xl">🛡️</span>
                            <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                                PadayON Admin
                            </span>
                        </Link>
                    </div>

                    <nav className="flex flex-1 flex-col">
                        <ul className="flex flex-1 flex-col gap-y-1">
                            {navigation.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={`group flex gap-x-3 rounded-xl p-3 text-sm leading-6 font-medium transition-all ${item.current
                                                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/20 shadow-lg shadow-indigo-500/10'
                                                : 'text-white/60 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <item.icon className="h-5 w-5 shrink-0" />
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* User menu */}
                    <div className="border-t border-white/10 pt-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                    {auth.user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{auth.user.name}</p>
                                <p className="text-xs text-white/40 truncate">{auth.user.email}</p>
                            </div>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="p-2 text-white/40 hover:text-red-400 transition-colors"
                                title="Logout"
                            >
                                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-white/10 bg-slate-900/60 backdrop-blur-xl px-4 sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-white/60 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>

                    <div className="h-6 w-px bg-white/10 lg:hidden" />

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex flex-1 items-center">
                            {title && (
                                <h1 className="text-lg font-semibold text-white">{title}</h1>
                            )}
                        </div>
                        <div className="flex items-center gap-x-4">
                            <Link
                                href="/dashboard"
                                className="text-xs text-white/40 hover:text-white/70 transition-colors"
                            >
                                ← Back to App
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Flash messages */}
                {flash?.success && (
                    <div className="mx-4 sm:mx-6 lg:mx-8 mt-4">
                        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                            <p className="text-sm font-medium text-emerald-400">{flash.success}</p>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="mx-4 sm:mx-6 lg:mx-8 mt-4">
                        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                            <p className="text-sm font-medium text-red-400">{flash.error}</p>
                        </div>
                    </div>
                )}

                <main className="py-6">
                    <div className="px-4 sm:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
