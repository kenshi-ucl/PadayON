import React, { useState, PropsWithChildren } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { PageProps, Tenant } from '@/types';
import {
    Bars3Icon,
    XMarkIcon,
    BellIcon,
    ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';

// Sidebar navigation icons
import dashboardIcon from '@/../images/dashboard.png';
import posIcon from '@/../images/pos.png';
import productsIcon from '@/../images/products.png';
import customersIcon from '@/../images/customers.png';
import ordersIcon from '@/../images/orders.png';
import reportsIcon from '@/../images/reports.png';
import scannerIcon from '@/../images/scanner.png';
import settingsIcon from '@/../images/settings.png';
import appLogo from '@/../images/PadayON.png';

interface NavigationItem {
    name: string;
    href: string;
    icon: string;
    current: boolean;
    badge?: number;
}

interface TenantLayoutProps extends PropsWithChildren {
    title?: string;
}

export default function TenantLayout({ children, title }: TenantLayoutProps) {
    const { auth, tenant, flash } = usePage<PageProps>().props;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const currentPath = window.location.pathname;

    const navigation: NavigationItem[] = [
        { name: 'Dashboard', href: '/dashboard', icon: dashboardIcon, current: currentPath === '/dashboard' || currentPath === '/' },
        { name: 'POS', href: '/pos', icon: posIcon, current: currentPath.startsWith('/pos') },
        { name: 'Products', href: '/products', icon: productsIcon, current: currentPath.startsWith('/products') },
        { name: 'Customers', href: '/customers', icon: customersIcon, current: currentPath.startsWith('/customers') },
        { name: 'Orders', href: '/orders', icon: ordersIcon, current: currentPath.startsWith('/orders') },
        { name: 'Reports', href: '/reports', icon: reportsIcon, current: currentPath.startsWith('/reports') },
        { name: 'Scanner', href: '/scanner', icon: scannerIcon, current: currentPath.startsWith('/scanner') },
        { name: 'Settings', href: '/settings', icon: settingsIcon, current: currentPath.startsWith('/settings') },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile sidebar */}
            <div className={clsx(
                'fixed inset-0 z-50 lg:hidden',
                sidebarOpen ? 'block' : 'hidden'
            )}>
                <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
                <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white">
                    <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b">
                        <Link href="/dashboard" className="flex items-center">
                            <img src={appLogo} alt="PadayON" className="h-10 object-contain" />
                        </Link>
                        <button onClick={() => setSidebarOpen(false)}>
                            <XMarkIcon className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>
                    <nav className="flex-1 overflow-y-auto px-4 py-4">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={clsx(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium mb-1',
                                    item.current
                                        ? 'bg-primary-50 text-primary-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                )}
                            >
                                <img src={item.icon} alt={item.name} className="h-5 w-5 object-contain" />
                                {item.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
                    <div className="flex h-16 shrink-0 items-center">
                        <Link href="/dashboard" className="flex items-center">
                            <img src={appLogo} alt="PadayON" className="h-10 object-contain" />
                        </Link>
                    </div>

                    {/* Business info */}
                    <div className="px-3 py-2 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {tenant?.business_name || tenant?.name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                            {tenant?.business_type?.replace(/_/g, ' ') || 'Business'}
                        </p>
                        <span className={clsx(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1',
                            tenant?.plan === 'free' ? 'bg-gray-100 text-gray-700' :
                                tenant?.plan === 'starter' ? 'bg-blue-100 text-blue-700' :
                                    tenant?.plan === 'pro' ? 'bg-purple-100 text-purple-700' :
                                        'bg-amber-100 text-amber-700'
                        )}>
                            {(tenant?.plan ?? 'free').charAt(0).toUpperCase() + (tenant?.plan ?? 'free').slice(1)} Plan
                        </span>
                    </div>

                    <nav className="flex flex-1 flex-col">
                        <ul role="list" className="flex flex-1 flex-col gap-y-1">
                            {navigation.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        href={item.href}
                                        className={clsx(
                                            'group flex gap-x-3 rounded-lg p-2 text-sm leading-6 font-medium',
                                            item.current
                                                ? 'bg-primary-50 text-primary-700'
                                                : 'text-gray-700 hover:text-primary-700 hover:bg-gray-50'
                                        )}
                                    >
                                        <img
                                            src={item.icon}
                                            alt={item.name}
                                            className="h-5 w-5 shrink-0 object-contain"
                                        />
                                        {item.name}
                                        {item.badge && (
                                            <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* User menu */}
                    <div className="border-t pt-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                                <span className="text-primary-700 font-medium text-sm">
                                    {auth.user.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {auth.user.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {auth.user.email}
                                </p>
                            </div>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="p-1.5 text-gray-400 hover:text-gray-600"
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
                <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
                    <button
                        type="button"
                        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Bars3Icon className="h-6 w-6" />
                    </button>

                    <div className="h-6 w-px bg-gray-200 lg:hidden" />

                    <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                        <div className="flex flex-1 items-center">
                            {title && (
                                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
                            )}
                        </div>
                        <div className="flex items-center gap-x-4 lg:gap-x-6">
                            <button
                                type="button"
                                className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500"
                            >
                                <BellIcon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Flash messages */}
                {flash?.success && (
                    <div className="mx-4 sm:mx-6 lg:mx-8 mt-4">
                        <div className="rounded-lg bg-green-50 p-4">
                            <p className="text-sm font-medium text-green-800">{flash.success}</p>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="mx-4 sm:mx-6 lg:mx-8 mt-4">
                        <div className="rounded-lg bg-red-50 p-4">
                            <p className="text-sm font-medium text-red-800">{flash.error}</p>
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
