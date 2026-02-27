import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

interface UserTenant {
    id: string;
    name: string;
    business_name: string | null;
    plan: string;
}

interface UserRecord {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    tenant_id: string | null;
    is_admin: boolean;
    is_owner: boolean;
    is_active: boolean;
    created_at: string;
    tenant?: UserTenant | null;
}

interface Pagination {
    data: UserRecord[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    users: Pagination;
    filters: {
        search?: string;
        status?: string;
        role?: string;
        plan?: string;
    };
}

const planColors: Record<string, string> = {
    free: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    starter: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    pro: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    business: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

export default function UsersIndex({ users, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [role, setRole] = useState(filters.role || '');
    const [plan, setPlan] = useState(filters.plan || '');
    const [deleteModal, setDeleteModal] = useState<number | null>(null);

    function applyFilters() {
        router.get('/admin/users', {
            search: search || undefined,
            status: status !== 'all' ? status : undefined,
            role: role || undefined,
            plan: plan || undefined,
        }, { preserveState: true });
    }

    function handleDelete(userId: number) {
        router.delete(`/admin/users/${userId}`, {
            onSuccess: () => setDeleteModal(null),
        });
    }

    return (
        <AdminLayout title="Users Management">
            <Head title="Users - Admin" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white">Users</h2>
                    <p className="text-sm text-white/50">{users.total} total users across all tenants</p>
                </div>
                <Link
                    href="/admin/users/create"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
                >
                    + Create User
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 mb-6">
                <div className="flex flex-wrap gap-3">
                    <input
                        type="text"
                        placeholder="Search name, email, phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                        className="flex-1 min-w-[200px] bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
                    />
                    <select
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); }}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        <option value="all" className="bg-slate-800">All Status</option>
                        <option value="active" className="bg-slate-800">Active</option>
                        <option value="inactive" className="bg-slate-800">Inactive</option>
                    </select>
                    <select
                        value={role}
                        onChange={(e) => { setRole(e.target.value); }}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        <option value="" className="bg-slate-800">All Roles</option>
                        <option value="admin" className="bg-slate-800">Admin</option>
                        <option value="owner" className="bg-slate-800">Owner</option>
                        <option value="staff" className="bg-slate-800">Staff</option>
                    </select>
                    <select
                        value={plan}
                        onChange={(e) => { setPlan(e.target.value); }}
                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    >
                        <option value="" className="bg-slate-800">All Plans</option>
                        <option value="free" className="bg-slate-800">Free</option>
                        <option value="starter" className="bg-slate-800">Starter</option>
                        <option value="pro" className="bg-slate-800">Pro</option>
                        <option value="business" className="bg-slate-800">Business</option>
                    </select>
                    <button
                        onClick={applyFilters}
                        className="px-4 py-2 bg-indigo-600/50 hover:bg-indigo-600 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                        Filter
                    </button>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="text-left text-xs text-white/40 uppercase border-b border-white/10">
                                <th className="px-6 py-4">User</th>
                                <th className="px-4 py-4">Store / Tenant</th>
                                <th className="px-4 py-4">Plan</th>
                                <th className="px-4 py-4">Role</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4">Joined</th>
                                <th className="px-4 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.data.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-sm font-bold">{user.name.charAt(0).toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{user.name}</p>
                                                <p className="text-xs text-white/40">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        {user.tenant ? (
                                            <span className="text-sm text-white/60">{user.tenant.business_name || user.tenant.name}</span>
                                        ) : (
                                            <span className="text-xs text-white/30 italic">Platform</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        {user.tenant ? (
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${planColors[user.tenant.plan]}`}>
                                                {user.tenant.plan}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-white/30">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`text-xs font-medium ${user.is_admin ? 'text-red-400' :
                                                user.is_owner ? 'text-amber-400' :
                                                    'text-white/50'
                                            }`}>
                                            {user.is_admin ? 'Admin' : user.is_owner ? 'Owner' : 'Staff'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center gap-1.5 text-xs ${user.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-white/40">
                                        {new Date(user.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/users/${user.id}`}
                                                className="px-3 py-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg transition-colors"
                                            >
                                                View
                                            </Link>
                                            <button
                                                onClick={() => setDeleteModal(user.id)}
                                                className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {users.data.length === 0 && (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-white/30 text-sm">No users found matching your filters.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.last_page > 1 && (
                    <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                        <p className="text-sm text-white/40">
                            Page {users.current_page} of {users.last_page} ({users.total} total)
                        </p>
                        <div className="flex gap-1">
                            {users.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${link.active
                                            ? 'bg-indigo-600 text-white'
                                            : link.url
                                                ? 'text-white/50 hover:bg-white/10'
                                                : 'text-white/20 cursor-not-allowed'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-white/10 p-6 max-w-sm w-full mx-4 shadow-2xl">
                        <h3 className="text-lg font-semibold text-white mb-2">Delete User</h3>
                        <p className="text-sm text-white/60 mb-6">Are you sure you want to delete this user? This action can be undone (soft delete).</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteModal(null)}
                                className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteModal)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
