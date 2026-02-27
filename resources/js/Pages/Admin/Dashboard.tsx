import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface DashboardStats {
    totalTenants: number;
    activeTenants: number;
    inactiveTenants: number;
    totalUsers: number;
    activeUsers: number;
    totalOrders: number;
    todayOrders: number;
    monthlyOrders: number;
    unpaidOrders: number;
    totalProducts: number;
    totalCustomers: number;
    totalRevenue: number;
    monthlyRevenue: number;
    todayRevenue: number;
    adminUsers: number;
    ownerUsers: number;
}

interface PlanCounts {
    free: number;
    starter: number;
    pro: number;
    business: number;
}

interface ChartPoint {
    date: string;
    revenue: number;
    orders: number;
}

interface RecentUser {
    id: number;
    name: string;
    email: string;
    tenant_id: string | null;
    is_admin: boolean;
    is_owner: boolean;
    is_active: boolean;
    created_at: string;
    tenant?: { id: string; name: string; plan: string } | null;
}

interface RecentOrder {
    id: number;
    order_number: string;
    total: number;
    payment_status: string;
    status: string;
    created_at: string;
    tenant?: { id: string; name: string } | null;
    customer?: { id: number; name: string } | null;
}

interface RecentTenant {
    id: string;
    name: string;
    business_name: string | null;
    plan: string;
    is_active: boolean;
    created_at: string;
    users_count: number;
    orders_count: number;
    products_count: number;
}

interface Props {
    stats: DashboardStats;
    planCounts: PlanCounts;
    revenueChart: ChartPoint[];
    recentUsers: RecentUser[];
    recentOrders: RecentOrder[];
    recentTenants: RecentTenant[];
}

function formatCurrency(amount: number): string {
    return '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
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
    pending: 'bg-yellow-500/20 text-yellow-300',
    completed: 'bg-emerald-500/20 text-emerald-300',
    cancelled: 'bg-red-500/20 text-red-300',
    processing: 'bg-blue-500/20 text-blue-300',
};

export default function AdminDashboard({ stats, planCounts, revenueChart, recentUsers, recentOrders, recentTenants }: Props) {
    const maxRevenue = Math.max(...revenueChart.map(d => d.revenue), 1);
    const totalPlanTenants = planCounts.free + planCounts.starter + planCounts.pro + planCounts.business;

    return (
        <AdminLayout title="Dashboard">
            <Head title="Admin Dashboard" />

            {/* KPI Cards - Row 1 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                <KPICard label="Total Tenants" value={stats.totalTenants} icon="🏪" color="indigo" subtext={`${stats.activeTenants} active`} />
                <KPICard label="Total Users" value={stats.totalUsers} icon="👥" color="cyan" subtext={`${stats.activeUsers} active`} />
                <KPICard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon="💰" color="emerald" subtext={`${formatCurrency(stats.monthlyRevenue)} this month`} />
                <KPICard label="Total Orders" value={stats.totalOrders} icon="📦" color="amber" subtext={`${stats.todayOrders} today`} />
                <KPICard label="Products" value={stats.totalProducts} icon="🏷️" color="violet" subtext="platform-wide" />
                <KPICard label="Customers" value={stats.totalCustomers} icon="🤝" color="rose" subtext="all stores" />
            </div>

            {/* Row 2: Revenue Chart + Plan Distribution */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-white">Revenue (Last 7 Days)</h3>
                        <span className="text-sm text-emerald-400 font-medium">
                            {formatCurrency(stats.todayRevenue)} Today
                        </span>
                    </div>
                    <div className="flex items-end gap-2 h-48">
                        {revenueChart.map((point, idx) => {
                            const heightPct = maxRevenue > 0 ? (point.revenue / maxRevenue) * 100 : 0;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-xs text-white/50">
                                        {point.revenue > 0 ? formatCurrency(point.revenue) : '₱0'}
                                    </span>
                                    <div className="w-full flex justify-center">
                                        <div
                                            className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-indigo-600 to-cyan-500 transition-all duration-500"
                                            style={{ height: `${Math.max(heightPct, 4)}%`, minHeight: '4px' }}
                                        />
                                    </div>
                                    <div className="text-center">
                                        <span className="text-xs text-white/40">{point.date}</span>
                                        <span className="block text-xs text-white/30">{point.orders} ord</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Plan Distribution */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Plan Distribution</h3>
                    <div className="space-y-4">
                        {(['free', 'starter', 'pro', 'business'] as const).map((plan) => {
                            const count = planCounts[plan];
                            const pct = totalPlanTenants > 0 ? (count / totalPlanTenants) * 100 : 0;
                            const barColor = plan === 'free' ? 'bg-gray-400' : plan === 'starter' ? 'bg-blue-400' : plan === 'pro' ? 'bg-purple-400' : 'bg-amber-400';
                            return (
                                <div key={plan}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm font-medium text-white/80 capitalize">{plan === 'free' ? 'Libre (Free)' : plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
                                        <span className="text-sm text-white/50">{count} ({pct.toFixed(0)}%)</span>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-2.5">
                                        <div className={`${barColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Unpaid Orders</span>
                            <span className="text-red-400 font-medium">{stats.unpaidOrders}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Admin Users</span>
                            <span className="text-indigo-400 font-medium">{stats.adminUsers}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Store Owners</span>
                            <span className="text-cyan-400 font-medium">{stats.ownerUsers}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 3: Recent Tenants */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">Recent Tenants</h3>
                    <Link href="/admin/tenants" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                        View All →
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-white/40 uppercase border-b border-white/10">
                                <th className="pb-3 pr-4">Store</th>
                                <th className="pb-3 pr-4">Plan</th>
                                <th className="pb-3 pr-4">Status</th>
                                <th className="pb-3 pr-4 text-right">Users</th>
                                <th className="pb-3 pr-4 text-right">Products</th>
                                <th className="pb-3 text-right">Orders</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {recentTenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-3 pr-4">
                                        <Link href={`/admin/tenants/${tenant.id}`} className="block">
                                            <span className="text-sm font-medium text-white">{tenant.business_name || tenant.name}</span>
                                            <span className="block text-xs text-white/40">{formatDate(tenant.created_at)}</span>
                                        </Link>
                                    </td>
                                    <td className="py-3 pr-4">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${planColors[tenant.plan]}`}>
                                            {tenant.plan}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-4">
                                        <span className={`inline-flex items-center gap-1 text-xs ${tenant.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${tenant.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                            {tenant.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="py-3 pr-4 text-right text-sm text-white/60">{tenant.users_count}</td>
                                    <td className="py-3 pr-4 text-right text-sm text-white/60">{tenant.products_count}</td>
                                    <td className="py-3 text-right text-sm text-white/60">{tenant.orders_count}</td>
                                </tr>
                            ))}
                            {recentTenants.length === 0 && (
                                <tr><td colSpan={6} className="py-8 text-center text-white/30 text-sm">No tenants found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Row 4: Recent Users + Recent Orders */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Recent Users */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Recent Users</h3>
                        <Link href="/admin/users" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
                            View All →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {recentUsers.map((user) => (
                            <Link key={user.id} href={`/admin/users/${user.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-sm font-bold">{user.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                                    <p className="text-xs text-white/40 truncate">{user.email}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    {user.tenant ? (
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${planColors[user.tenant.plan]}`}>
                                            {user.tenant.plan}
                                        </span>
                                    ) : user.is_admin ? (
                                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-300 border border-red-500/30">admin</span>
                                    ) : null}
                                    <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-gray-500'}`} />
                                </div>
                            </Link>
                        ))}
                        {recentUsers.length === 0 && (
                            <p className="text-center text-white/30 text-sm py-8">No users found</p>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
                        <span className="text-sm text-white/40">{stats.monthlyOrders} this month</span>
                    </div>
                    <div className="space-y-3">
                        {recentOrders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white">{order.order_number}</p>
                                    <p className="text-xs text-white/40 truncate">
                                        {order.tenant?.name || 'Unknown'} · {order.customer?.name || 'Walk-in'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.payment_status] || 'bg-gray-500/20 text-gray-300'}`}>
                                        {order.payment_status}
                                    </span>
                                    <span className="text-sm font-semibold text-white">
                                        {formatCurrency(order.total)}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {recentOrders.length === 0 && (
                            <p className="text-center text-white/30 text-sm py-8">No orders found</p>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

/* ─── KPI Card Component ─── */
function KPICard({ label, value, icon, color, subtext }: {
    label: string;
    value: string | number;
    icon: string;
    color: string;
    subtext?: string;
}) {
    const gradientMap: Record<string, string> = {
        indigo: 'from-indigo-600/20 to-indigo-800/10 border-indigo-500/20',
        cyan: 'from-cyan-600/20 to-cyan-800/10 border-cyan-500/20',
        emerald: 'from-emerald-600/20 to-emerald-800/10 border-emerald-500/20',
        amber: 'from-amber-600/20 to-amber-800/10 border-amber-500/20',
        violet: 'from-violet-600/20 to-violet-800/10 border-violet-500/20',
        rose: 'from-rose-600/20 to-rose-800/10 border-rose-500/20',
    };

    const textColorMap: Record<string, string> = {
        indigo: 'text-indigo-400',
        cyan: 'text-cyan-400',
        emerald: 'text-emerald-400',
        amber: 'text-amber-400',
        violet: 'text-violet-400',
        rose: 'text-rose-400',
    };

    return (
        <div className={`bg-gradient-to-br ${gradientMap[color]} backdrop-blur-md rounded-2xl border p-4 hover:scale-[1.02] transition-transform`}>
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
            </div>
            <p className={`text-2xl font-bold ${textColorMap[color]}`}>{value}</p>
            <p className="text-xs text-white/50 mt-1">{label}</p>
            {subtext && <p className="text-xs text-white/30 mt-0.5">{subtext}</p>}
        </div>
    );
}
