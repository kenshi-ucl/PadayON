import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface TenantData {
    id: string;
    name: string;
    business_name: string | null;
    business_type: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    province: string | null;
    plan: string;
    is_active: boolean;
    trial_ends_at: string | null;
    subscription_ends_at: string | null;
    created_at: string;
    users_count: number;
    orders_count: number;
    products_count: number;
    customers_count: number;
}

interface TenantUser {
    id: number;
    name: string;
    email: string;
    is_admin: boolean;
    is_owner: boolean;
    is_active: boolean;
}

interface TenantOrder {
    id: number;
    order_number: string;
    total: number;
    payment_status: string;
    status: string;
    created_at: string;
    customer?: { name: string } | null;
}

interface ChartPoint {
    date: string;
    revenue: number;
    orders: number;
}

interface OrderStats {
    total: number;
    paid: number;
    unpaid: number;
    cancelled: number;
}

interface Props {
    tenant: TenantData;
    tenantUsers: TenantUser[];
    tenantRevenue: number;
    monthlyRevenue: number;
    recentOrders: TenantOrder[];
    orderStats: OrderStats;
    revenueChart: ChartPoint[];
}

function formatCurrency(amount: number): string {
    return '₱' + Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

export default function TenantShow({ tenant, tenantUsers, tenantRevenue, monthlyRevenue, recentOrders, orderStats, revenueChart }: Props) {
    const [editing, setEditing] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const maxRevenue = Math.max(...revenueChart.map(c => c.revenue), 1);

    const { data, setData, patch, processing } = useForm({
        plan: tenant.plan,
        is_active: tenant.is_active,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        patch(`/admin/tenants/${tenant.id}`, {
            onSuccess: () => setEditing(false),
        });
    }

    return (
        <AdminLayout title="Tenant Details">
            <Head title={`${tenant.business_name || tenant.name} - Admin`} />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
                <Link href="/admin/tenants" className="hover:text-white/60 transition-colors">Tenants</Link>
                <span>/</span>
                <span className="text-white/70">{tenant.business_name || tenant.name}</span>
            </div>

            {/* Header Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <span className="text-3xl">🏪</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">{tenant.business_name || tenant.name}</h2>
                            <p className="text-sm text-white/50">{tenant.email}</p>
                            {tenant.phone && <p className="text-xs text-white/40">{tenant.phone}</p>}
                            {(tenant.city || tenant.province) && (
                                <p className="text-xs text-white/30 mt-1">📍 {[tenant.city, tenant.province].filter(Boolean).join(', ')}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${tenant.is_active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tenant.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {tenant.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${planColors[tenant.plan]}`}>
                            {tenant.plan} plan
                        </span>
                        <button
                            onClick={() => setEditing(!editing)}
                            className="px-4 py-2 text-sm font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition-colors"
                        >
                            {editing ? 'Cancel' : 'Edit'}
                        </button>
                    </div>
                </div>

                {/* Edit form */}
                {editing && (
                    <form onSubmit={handleSubmit} className="border-t border-white/10 pt-6 mt-6">
                        <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs text-white/50 mb-1.5">Plan</label>
                                <select
                                    value={data.plan}
                                    onChange={e => setData('plan', e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                >
                                    <option value="free" className="bg-slate-800">Free (Libre)</option>
                                    <option value="starter" className="bg-slate-800">Starter - ₱500/mo</option>
                                    <option value="pro" className="bg-slate-800">Pro - ₱1,500/mo</option>
                                    <option value="business" className="bg-slate-800">Business - ₱2,500/mo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-white/50 mb-1.5">Status</label>
                                <select
                                    value={data.is_active ? 'active' : 'inactive'}
                                    onChange={e => setData('is_active', e.target.value === 'active')}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                >
                                    <option value="active" className="bg-slate-800">Active</option>
                                    <option value="inactive" className="bg-slate-800">Inactive</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
                                >
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <StatCard label="Total Revenue" value={formatCurrency(tenantRevenue)} color="emerald" />
                <StatCard label="Monthly Revenue" value={formatCurrency(monthlyRevenue)} color="cyan" />
                <StatCard label="Total Orders" value={orderStats.total} color="indigo" />
                <StatCard label="Unpaid Orders" value={orderStats.unpaid} color="red" />
            </div>

            {/* Row 2: Revenue Chart + Order Stats */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Revenue (Last 7 Days)</h3>
                    <div className="flex items-end gap-2 h-40">
                        {revenueChart.map((point, idx) => {
                            const heightPct = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-xs text-white/40">{point.revenue > 0 ? formatCurrency(point.revenue) : '₱0'}</span>
                                    <div className="w-full flex justify-center">
                                        <div
                                            className="w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-purple-600 to-indigo-500 transition-all duration-500"
                                            style={{ height: `${Math.max(heightPct, 4)}%`, minHeight: '4px' }}
                                        />
                                    </div>
                                    <span className="text-xs text-white/30">{point.date}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Order Breakdown */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Order Breakdown</h3>
                    <div className="space-y-4">
                        <BreakdownItem label="Paid" count={orderStats.paid} total={orderStats.total} color="bg-emerald-400" />
                        <BreakdownItem label="Unpaid" count={orderStats.unpaid} total={orderStats.total} color="bg-red-400" />
                        <BreakdownItem label="Cancelled" count={orderStats.cancelled} total={orderStats.total} color="bg-gray-400" />
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Users</span>
                            <span className="text-white font-medium">{tenant.users_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Products</span>
                            <span className="text-white font-medium">{tenant.products_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Customers</span>
                            <span className="text-white font-medium">{tenant.customers_count}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Member Since</span>
                            <span className="text-white/70 text-xs">{new Date(tenant.created_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 3: Users + Recent Orders */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
                {/* Users */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Users ({tenantUsers.length})</h3>
                    <div className="space-y-2">
                        {tenantUsers.map(user => (
                            <Link key={user.id} href={`/admin/users/${user.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{user.name}</p>
                                        <p className="text-xs text-white/40">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium ${user.is_admin ? 'text-red-400' : user.is_owner ? 'text-amber-400' : 'text-white/40'
                                        }`}>
                                        {user.is_admin ? 'Admin' : user.is_owner ? 'Owner' : 'Staff'}
                                    </span>
                                    <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                                </div>
                            </Link>
                        ))}
                        {tenantUsers.length === 0 && (
                            <p className="text-sm text-white/30 py-4 text-center">No users assigned</p>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Recent Orders</h3>
                    <div className="space-y-2">
                        {recentOrders.map(order => (
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
                        {recentOrders.length === 0 && (
                            <p className="text-sm text-white/30 py-4 text-center">No orders yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 backdrop-blur-md rounded-2xl border border-red-500/20 p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h3>
                <p className="text-xs text-white/40 mb-4">Destructive actions for this tenant.</p>
                <div className="flex flex-wrap gap-3">
                    {tenant.is_active ? (
                        <button
                            onClick={() => router.patch(`/admin/tenants/${tenant.id}`, { is_active: false })}
                            className="px-4 py-2 text-sm font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors"
                        >
                            Deactivate Tenant
                        </button>
                    ) : (
                        <button
                            onClick={() => router.patch(`/admin/tenants/${tenant.id}`, { is_active: true })}
                            className="px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-colors"
                        >
                            Activate Tenant
                        </button>
                    )}
                    <button
                        onClick={() => setDeleteModal(true)}
                        className="px-4 py-2 text-sm font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors"
                    >
                        Delete Tenant
                    </button>
                </div>
            </div>

            {/* Delete Modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete Tenant</h3>
                        <p className="text-sm text-white/60 mb-6">Are you sure you want to delete <strong className="text-white">{tenant.business_name || tenant.name}</strong>? This will soft-delete the tenant and all related data.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteModal(false)} className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors">Cancel</button>
                            <button onClick={() => router.delete(`/admin/tenants/${tenant.id}`)} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

/* ─── Sub-Components ─── */

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
    const colors: Record<string, string> = {
        emerald: 'from-emerald-600/20 to-emerald-800/10 border-emerald-500/20 text-emerald-400',
        cyan: 'from-cyan-600/20 to-cyan-800/10 border-cyan-500/20 text-cyan-400',
        indigo: 'from-indigo-600/20 to-indigo-800/10 border-indigo-500/20 text-indigo-400',
        red: 'from-red-600/20 to-red-800/10 border-red-500/20 text-red-400',
    };
    return (
        <div className={`bg-gradient-to-br ${colors[color]} backdrop-blur-md rounded-2xl border p-4`}>
            <p className="text-xs text-white/50 mb-1">{label}</p>
            <p className={`text-xl font-bold ${colors[color].split(' ').pop()}`}>{value}</p>
        </div>
    );
}

function BreakdownItem({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-white/70">{label}</span>
                <span className="text-sm text-white/50">{count} ({pct.toFixed(0)}%)</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
                <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}
