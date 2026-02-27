import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface TenantOption {
    id: string;
    name: string;
    business_name: string | null;
    plan: string;
}

interface Props {
    tenants: TenantOption[];
}

export default function CreateUser({ tenants }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        tenant_id: '',
        is_admin: false,
        is_owner: false,
        is_active: true,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/admin/users');
    }

    return (
        <AdminLayout title="Create User">
            <Head title="Create User - Admin" />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
                <Link href="/admin/users" className="hover:text-white/60 transition-colors">Users</Link>
                <span>/</span>
                <span className="text-white/70">Create</span>
            </div>

            <div className="max-w-2xl">
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Create New User</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-white/50 mb-1.5">Full Name *</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={e => setData('name', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    placeholder="Juan Dela Cruz"
                                    required
                                />
                                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 mb-1.5">Email *</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    placeholder="juan@example.com"
                                    required
                                />
                                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-white/50 mb-1.5">Phone</label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    placeholder="09XX XXX XXXX"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 mb-1.5">Password *</label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                    placeholder="Minimum 8 characters"
                                    required
                                />
                                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs text-white/50 mb-1.5">Assign to Tenant</label>
                            <select
                                value={data.tenant_id}
                                onChange={e => setData('tenant_id', e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            >
                                <option value="" className="bg-slate-800">No Tenant (Platform User)</option>
                                {tenants.map(t => (
                                    <option key={t.id} value={t.id} className="bg-slate-800">
                                        {t.business_name || t.name} ({t.plan})
                                    </option>
                                ))}
                            </select>
                            {errors.tenant_id && <p className="text-xs text-red-400 mt-1">{errors.tenant_id}</p>}
                        </div>

                        <div className="flex flex-wrap gap-6">
                            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={e => setData('is_active', e.target.checked)}
                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/50"
                                />
                                Active
                            </label>
                            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_admin}
                                    onChange={e => setData('is_admin', e.target.checked)}
                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-red-500 focus:ring-red-500/50"
                                />
                                Platform Admin
                            </label>
                            <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.is_owner}
                                    onChange={e => setData('is_owner', e.target.checked)}
                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/50"
                                />
                                Store Owner
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                            <Link
                                href="/admin/users"
                                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
                            >
                                {processing ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
