import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface UserTenant {
    id: string;
    name: string;
    business_name: string | null;
    plan: string;
    is_active: boolean;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    tenant_id: string | null;
    is_admin: boolean;
    is_owner: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    tenant?: UserTenant | null;
}

interface UserOrder {
    id: number;
    order_number: string;
    total: number;
    payment_status: string;
    status: string;
    created_at: string;
    customer?: { name: string } | null;
}

interface TenantOption {
    id: string;
    name: string;
    business_name: string | null;
    plan: string;
}

interface Props {
    user: UserData;
    userOrders: UserOrder[];
    userStats: { totalOrders: number; totalRevenue: number };
    tenants: TenantOption[];
}

function formatCurrency(amount: number): string {
    return '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const planColors: Record<string, string> = {
    free: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    starter: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    pro: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    business: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

const statusColors: Record<string, string> = {
    paid: 'bg-emerald-500/20 text-emerald-300',
    unpaid: 'bg-red-500/20 text-red-300',
    partial: 'bg-yellow-500/20 text-yellow-300',
};

export default function UserShow({ user, userOrders, userStats, tenants }: Props) {
    const [editing, setEditing] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);

    const { data, setData, patch, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        password: '',
        is_active: user.is_active,
        is_admin: user.is_admin,
        is_owner: user.is_owner,
        tenant_id: user.tenant_id || '',
        tenant_plan: user.tenant?.plan || 'free',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        patch(`/admin/users/${user.id}`, {
            onSuccess: () => setEditing(false),
        });
    }

    function handleDelete() {
        router.delete(`/admin/users/${user.id}`);
    }

    return (
        <AdminLayout title="User Details">
            <Head title={`${user.name} - Admin`} />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
                <Link href="/admin/users" className="hover:text-white/60 transition-colors">Users</Link>
                <span>/</span>
                <span className="text-white/70">{user.name}</span>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: User Profile + Edit Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Profile Card */}
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                                    <span className="text-white text-2xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{user.name}</h2>
                                    <p className="text-sm text-white/50">{user.email}</p>
                                    {user.phone && <p className="text-xs text-white/40">{user.phone}</p>}
                                </div>
                            </div>
                            <button
                                onClick={() => setEditing(!editing)}
                                className="px-4 py-2 text-sm font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition-colors"
                            >
                                {editing ? 'Cancel' : 'Edit'}
                            </button>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.is_admin ? 'bg-red-500/20 text-red-300' :
                                    user.is_owner ? 'bg-amber-500/20 text-amber-300' :
                                        'bg-gray-500/20 text-gray-300'
                                }`}>
                                {user.is_admin ? 'Platform Admin' : user.is_owner ? 'Store Owner' : 'Staff'}
                            </span>
                            {user.tenant && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${planColors[user.tenant.plan]}`}>
                                    {user.tenant.plan} plan
                                </span>
                            )}
                        </div>

                        {/* Edit Form */}
                        {editing && (
                            <form onSubmit={handleSubmit} className="space-y-4 border-t border-white/10 pt-6">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-white/50 mb-1.5">Name</label>
                                        <input
                                            type="text"
                                            value={data.name}
                                            onChange={e => setData('name', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/50 mb-1.5">Email</label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={e => setData('email', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                        {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/50 mb-1.5">Phone</label>
                                        <input
                                            type="text"
                                            value={data.phone}
                                            onChange={e => setData('phone', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/50 mb-1.5">New Password (leave blank to keep)</label>
                                        <input
                                            type="password"
                                            value={data.password}
                                            onChange={e => setData('password', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-white/50 mb-1.5">Assign Tenant</label>
                                        <select
                                            value={data.tenant_id}
                                            onChange={e => setData('tenant_id', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        >
                                            <option value="" className="bg-slate-800">No Tenant (Platform)</option>
                                            {tenants.map(t => (
                                                <option key={t.id} value={t.id} className="bg-slate-800">
                                                    {t.business_name || t.name} ({t.plan})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-white/50 mb-1.5">Tenant Plan</label>
                                        <select
                                            value={data.tenant_plan}
                                            onChange={e => setData('tenant_plan', e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            disabled={!data.tenant_id}
                                        >
                                            <option value="free" className="bg-slate-800">Free (Libre)</option>
                                            <option value="starter" className="bg-slate-800">Starter - ₱500/mo</option>
                                            <option value="pro" className="bg-slate-800">Pro - ₱1,500/mo</option>
                                            <option value="business" className="bg-slate-800">Business - ₱2,500/mo</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-6 pt-2">
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
                                    <button
                                        type="button"
                                        onClick={() => setEditing(false)}
                                        className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
                                    >
                                        {processing ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Orders History */}
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Order History</h3>
                        {userOrders.length > 0 ? (
                            <div className="space-y-2">
                                {userOrders.map(order => (
                                    <div key={order.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-white">{order.order_number}</p>
                                            <p className="text-xs text-white/40">
                                                {order.customer?.name || 'Walk-in'} · {new Date(order.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.payment_status] || 'bg-gray-500/20 text-gray-300'}`}>
                                                {order.payment_status}
                                            </span>
                                            <span className="text-sm font-semibold text-white">{formatCurrency(order.total)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-white/30 py-4 text-center">No orders found for this user</p>
                        )}
                    </div>
                </div>

                {/* Right: Stats & Danger Zone */}
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Stats</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-white/50">Total Orders</span>
                                <span className="text-lg font-bold text-indigo-400">{userStats.totalOrders}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-white/50">Total Revenue</span>
                                <span className="text-lg font-bold text-emerald-400">{formatCurrency(userStats.totalRevenue)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-white/50">Member Since</span>
                                <span className="text-sm text-white/70">{new Date(user.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tenant Info */}
                    {user.tenant && (
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4">Store / Tenant</h3>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-xs text-white/40">Store Name</span>
                                    <p className="text-sm font-medium text-white">{user.tenant.business_name || user.tenant.name}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-white/40">Current Plan</span>
                                    <p className="mt-1">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${planColors[user.tenant.plan]}`}>
                                            {user.tenant.plan}
                                        </span>
                                    </p>
                                </div>
                                <div>
                                    <span className="text-xs text-white/40">Store Status</span>
                                    <p className={`text-sm font-medium ${user.tenant.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {user.tenant.is_active ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                                <Link
                                    href={`/admin/tenants/${user.tenant.id}`}
                                    className="block text-center px-4 py-2 mt-2 text-sm text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition-colors"
                                >
                                    View Tenant Details →
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* Danger Zone */}
                    <div className="bg-red-500/5 backdrop-blur-md rounded-2xl border border-red-500/20 p-6">
                        <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
                        <p className="text-xs text-white/40 mb-4">These actions are destructive and cannot be easily reversed.</p>
                        <div className="space-y-3">
                            {user.is_active ? (
                                <button
                                    onClick={() => router.patch(`/admin/users/${user.id}`, { is_active: false })}
                                    className="w-full px-4 py-2 text-sm font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors"
                                >
                                    Deactivate User
                                </button>
                            ) : (
                                <button
                                    onClick={() => router.patch(`/admin/users/${user.id}`, { is_active: true })}
                                    className="w-full px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-colors"
                                >
                                    Activate User
                                </button>
                            )}
                            <button
                                onClick={() => setDeleteModal(true)}
                                className="w-full px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors"
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete User</h3>
                        <p className="text-sm text-white/60 mb-6">Are you sure you want to delete <strong className="text-white">{user.name}</strong>?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteModal(false)} className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">Cancel</button>
                            <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
