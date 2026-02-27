import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, Tenant } from '@/types';
import {
    GlobeAltIcon,
    PaintBrushIcon,
    DocumentTextIcon,
    LinkIcon,
    EyeIcon,
    CheckCircleIcon,
    XMarkIcon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface Page {
    id: number;
    title: string;
    slug: string;
    is_published: boolean;
    updated_at: string;
}

interface WebsiteSettings {
    is_published: boolean;
    primary_color: string;
    template: string;
    logo: string | null;
    banner_image: string | null;
    tagline: string | null;
    about_text: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    facebook_url: string | null;
    instagram_url: string | null;
    custom_domain: string | null;
}

interface WebsiteIndexProps extends PageProps {
    tenant: Tenant;
    settings: WebsiteSettings;
    pages: Page[];
    templates: Record<string, string>;
}

const defaultTemplates: Record<string, string> = {
    sari_modern: 'Modern Store',
    laundry_clean: 'Clean Laundry',
    catering_elegant: 'Elegant Catering',
    minimal: 'Minimal',
    vibrant: 'Vibrant Filipino',
};

export default function WebsiteIndex({ tenant, settings, pages, templates }: WebsiteIndexProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'design' | 'pages' | 'settings'>('overview');
    const [isPublishing, setIsPublishing] = useState(false);

    const usedTemplates = templates || defaultTemplates;

    const websiteUrl = `https://${tenant?.slug}.PadayON.ph`;

    const handlePublish = () => {
        setIsPublishing(true);
        router.post('/website/publish', {}, {
            onSuccess: () => toast.success('Website published!'),
            onError: () => toast.error('Failed to publish'),
            onFinish: () => setIsPublishing(false),
        });
    };

    const handleUnpublish = () => {
        setIsPublishing(true);
        router.post('/website/unpublish', {}, {
            onSuccess: () => toast.success('Website unpublished'),
            onError: () => toast.error('Failed to unpublish'),
            onFinish: () => setIsPublishing(false),
        });
    };

    const tabs = [
        { id: 'overview', name: 'Overview', icon: GlobeAltIcon },
        { id: 'design', name: 'Design', icon: PaintBrushIcon },
        { id: 'pages', name: 'Pages', icon: DocumentTextIcon },
        { id: 'settings', name: 'Settings', icon: LinkIcon },
    ];

    return (
        <TenantLayout title="Website">
            <Head title="Website Builder" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Website Builder</h1>
                    <p className="text-gray-500">Customize your online storefront</p>
                </div>
                <div className="flex gap-3">
                    <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <EyeIcon className="h-5 w-5" />
                        Preview
                    </a>
                    {settings?.is_published ? (
                        <button
                            onClick={handleUnpublish}
                            disabled={isPublishing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400"
                        >
                            Unpublish
                        </button>
                    ) : (
                        <button
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                        >
                            <CheckCircleIcon className="h-5 w-5" />
                            Publish
                        </button>
                    )}
                </div>
            </div>

            {/* Status Banner */}
            <div className={clsx(
                'rounded-xl p-4 mb-6 flex items-center justify-between',
                settings?.is_published ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
            )}>
                <div className="flex items-center gap-3">
                    {settings?.is_published ? (
                        <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    ) : (
                        <XMarkIcon className="h-6 w-6 text-yellow-600" />
                    )}
                    <div>
                        <p className={clsx('font-medium', settings?.is_published ? 'text-green-800' : 'text-yellow-800')}>
                            {settings?.is_published ? 'Your website is live!' : 'Your website is not published'}
                        </p>
                        <p className={clsx('text-sm', settings?.is_published ? 'text-green-600' : 'text-yellow-600')}>
                            {settings?.is_published
                                ? `Available at ${websiteUrl}`
                                : 'Publish to make your store visible online'}
                        </p>
                    </div>
                </div>
                {settings?.is_published && (
                    <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-700 hover:text-green-800 font-medium"
                    >
                        Visit site →
                    </a>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 border-b">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={clsx(
                            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
                            activeTab === tab.id
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                        )}
                    >
                        <tab.icon className="h-5 w-5" />
                        {tab.name}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Website Preview</h3>
                        <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                            <div className="text-center">
                                <GlobeAltIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500">Preview coming soon</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Pages</p>
                                    <p className="text-2xl font-bold">{pages?.length || 0}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Visits Today</p>
                                    <p className="text-2xl font-bold">0</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Website URL</h3>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={websiteUrl}
                                    readOnly
                                    className="flex-1 px-4 py-2 bg-gray-50 border rounded-lg"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(websiteUrl);
                                        toast.success('URL copied!');
                                    }}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Design Tab */}
            {activeTab === 'design' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Choose Template</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Object.entries(usedTemplates).map(([id, name]) => (
                            <button
                                key={id}
                                onClick={() => {
                                    router.patch('/website/settings', { template: id }, {
                                        onSuccess: () => toast.success('Template updated!'),
                                    });
                                }}
                                className={clsx(
                                    'p-4 border-2 rounded-xl text-center transition-all',
                                    settings?.template === id
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                )}
                            >
                                <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                                    <PaintBrushIcon className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="font-medium text-sm">{name}</p>
                                {settings?.template === id && (
                                    <span className="inline-block mt-2 text-xs text-primary-600">Active</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Pages Tab */}
            {activeTab === 'pages' && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">Pages</h3>
                        <Link
                            href="/website/pages/create"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Add Page
                        </Link>
                    </div>
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {pages && pages.length > 0 ? (
                                pages.map((page) => (
                                    <tr key={page.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{page.title}</td>
                                        <td className="px-6 py-4 text-gray-500">/p/{page.slug}</td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                'px-2 py-1 rounded-full text-xs font-medium',
                                                page.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            )}>
                                                {page.is_published ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/website/pages/${page.id}/edit`}
                                                className="text-primary-600 hover:text-primary-700"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No pages created yet
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Website Settings</h3>
                    <form className="space-y-6 max-w-xl">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                            <input
                                type="text"
                                defaultValue={settings?.tagline || ''}
                                placeholder="Your catchy tagline"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                            <input
                                type="email"
                                defaultValue={settings?.contact_email || ''}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                            <input
                                type="tel"
                                defaultValue={settings?.contact_phone || ''}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                            <input
                                type="url"
                                defaultValue={settings?.facebook_url || ''}
                                placeholder="https://facebook.com/yourpage"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                            <input
                                type="url"
                                defaultValue={settings?.instagram_url || ''}
                                placeholder="https://instagram.com/yourpage"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                            Save Changes
                        </button>
                    </form>
                </div>
            )}
        </TenantLayout>
    );
}
