import React, { useState, useMemo } from 'react';
import { usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { PageProps, OwnerRecipient } from '@/types';
import {
    PaperAirplaneIcon,
    MegaphoneIcon,
    ExclamationTriangleIcon,
    ClipboardDocumentCheckIcon,
    CheckIcon,
    UserGroupIcon,
    MagnifyingGlassIcon,
    ClockIcon,
    EnvelopeIcon,
    EyeIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';

interface SentNotification {
    id: string;
    title: string;
    body: string;
    type: string;
    priority: string;
    sender_name: string;
    recipient_count: number;
    read_count: number;
    created_at: string;
}

interface Props extends PageProps {
    owners: OwnerRecipient[];
    sentHistory: SentNotification[];
    planCounts: Record<string, number>;
}

const notificationTypes = [
    { value: 'announcement', label: 'Announcement', icon: MegaphoneIcon, color: 'indigo' },
    { value: 'alert', label: 'Alert', icon: ExclamationTriangleIcon, color: 'red' },
    { value: 'task', label: 'Task', icon: ClipboardDocumentCheckIcon, color: 'blue' },
] as const;

const priorityOptions = [
    { value: 'low', label: 'Low', color: 'text-gray-500' },
    { value: 'normal', label: 'Normal', color: 'text-blue-600' },
    { value: 'high', label: 'High', color: 'text-red-600' },
] as const;

const planLabels: Record<string, { label: string; color: string }> = {
    free: { label: 'Free', color: 'bg-gray-100 text-gray-700' },
    starter: { label: 'Starter', color: 'bg-blue-100 text-blue-700' },
    pro: { label: 'Pro', color: 'bg-purple-100 text-purple-700' },
    business: { label: 'Business', color: 'bg-amber-100 text-amber-700' },
};

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminNotificationsIndex() {
    const { owners, sentHistory, planCounts } = usePage<Props>().props;

    // Send form state
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [notificationType, setNotificationType] = useState('announcement');
    const [priority, setPriority] = useState('normal');
    const [target, setTarget] = useState<'all' | 'specific' | 'by_plan'>('all');
    const [selectedOwnerIds, setSelectedOwnerIds] = useState<number[]>([]);
    const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
    const [ownerSearch, setOwnerSearch] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Expanded history row
    const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

    // Filter owners by search
    const filteredOwners = useMemo(() => {
        if (!ownerSearch.trim()) return owners;
        const q = ownerSearch.toLowerCase();
        return owners.filter(
            (o) =>
                o.name.toLowerCase().includes(q) ||
                o.email.toLowerCase().includes(q) ||
                o.tenant_name.toLowerCase().includes(q)
        );
    }, [owners, ownerSearch]);

    const toggleOwner = (id: number) => {
        setSelectedOwnerIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const selectAllOwners = () => {
        if (selectedOwnerIds.length === filteredOwners.length) {
            setSelectedOwnerIds([]);
        } else {
            setSelectedOwnerIds(filteredOwners.map((o) => o.id));
        }
    };

    const togglePlan = (plan: string) => {
        setSelectedPlans((prev) =>
            prev.includes(plan) ? prev.filter((p) => p !== plan) : [...prev, plan]
        );
    };

    const estimatedRecipients = useMemo(() => {
        switch (target) {
            case 'all':
                return owners.length;
            case 'specific':
                return selectedOwnerIds.length;
            case 'by_plan':
                return selectedPlans.reduce((sum, plan) => sum + (planCounts[plan] || 0), 0);
        }
    }, [target, owners, selectedOwnerIds, selectedPlans, planCounts]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!title.trim()) newErrors.title = 'Title is required';
        if (title.length > 255) newErrors.title = 'Title must not exceed 255 characters';
        if (!body.trim()) newErrors.body = 'Message is required';
        if (body.length > 5000) newErrors.body = 'Message must not exceed 5000 characters';
        if (target === 'specific' && selectedOwnerIds.length === 0) {
            newErrors.recipients = 'Select at least one owner';
        }
        if (target === 'by_plan' && selectedPlans.length === 0) {
            newErrors.plans = 'Select at least one plan';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSending(true);
        try {
            const payload: any = {
                title: title.trim(),
                body: body.trim(),
                notification_type: notificationType,
                priority,
                target,
            };

            if (target === 'specific') {
                payload.recipient_ids = selectedOwnerIds;
            }
            if (target === 'by_plan') {
                payload.plans = selectedPlans;
            }

            const response = await axios.post('/admin/notifications/send', payload);
            toast.success(response.data.message || 'Notification sent!');
            resetForm();
            // Reload to refresh sent history
            window.location.reload();
        } catch (error: any) {
            const message =
                error.response?.data?.error ||
                error.response?.data?.message ||
                'Failed to send notification';
            toast.error(message);
        } finally {
            setIsSending(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setBody('');
        setNotificationType('announcement');
        setPriority('normal');
        setTarget('all');
        setSelectedOwnerIds([]);
        setSelectedPlans([]);
        setOwnerSearch('');
        setErrors({});
    };

    return (
        <AdminLayout title="Notifications">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Send Notification Section */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20">
                            <PaperAirplaneIcon className="h-5 w-5 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Send Notification</h2>
                            <p className="text-sm text-white/50">Send in-app notifications to store owners</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left column: Content */}
                            <div className="space-y-4">
                                {/* Type selector */}
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Type</label>
                                    <div className="flex gap-2">
                                        {notificationTypes.map((type) => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setNotificationType(type.value)}
                                                className={clsx(
                                                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border transition-all',
                                                    notificationType === type.value
                                                        ? type.color === 'indigo'
                                                            ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300'
                                                            : type.color === 'red'
                                                                ? 'border-red-500/50 bg-red-500/20 text-red-300'
                                                                : 'border-blue-500/50 bg-blue-500/20 text-blue-300'
                                                        : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                                                )}
                                            >
                                                <type.icon className="h-4 w-4" />
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Priority</label>
                                    <div className="flex gap-2">
                                        {priorityOptions.map((p) => (
                                            <button
                                                key={p.value}
                                                type="button"
                                                onClick={() => setPriority(p.value)}
                                                className={clsx(
                                                    'rounded-lg px-3 py-1.5 text-sm font-medium border transition-all',
                                                    priority === p.value
                                                        ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300'
                                                        : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                                                )}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className={clsx(
                                            'w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                                            errors.title ? 'border-red-500/50' : 'border-white/10'
                                        )}
                                        placeholder="Enter notification title..."
                                        maxLength={255}
                                    />
                                    {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
                                </div>

                                {/* Body */}
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-1">Message</label>
                                    <textarea
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        rows={4}
                                        className={clsx(
                                            'w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none',
                                            errors.body ? 'border-red-500/50' : 'border-white/10'
                                        )}
                                        placeholder="Write your notification message..."
                                        maxLength={5000}
                                    />
                                    <div className="flex justify-between mt-1">
                                        {errors.body && <p className="text-xs text-red-400">{errors.body}</p>}
                                        <span className="text-xs text-white/30 ml-auto">{body.length}/5000</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right column: Recipients */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-white/80 mb-2">Target Recipients</label>
                                    <div className="space-y-2">
                                        {/* All owners */}
                                        <label className={clsx(
                                            'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all',
                                            target === 'all'
                                                ? 'border-indigo-500/50 bg-indigo-500/10'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                        )}>
                                            <input
                                                type="radio"
                                                name="target"
                                                value="all"
                                                checked={target === 'all'}
                                                onChange={() => setTarget('all')}
                                                className="text-indigo-500 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white">All Owners</p>
                                                <p className="text-xs text-white/50">{owners.length} active owner(s)</p>
                                            </div>
                                            <UserGroupIcon className="h-5 w-5 text-white/30" />
                                        </label>

                                        {/* Specific owners */}
                                        <label className={clsx(
                                            'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all',
                                            target === 'specific'
                                                ? 'border-indigo-500/50 bg-indigo-500/10'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                        )}>
                                            <input
                                                type="radio"
                                                name="target"
                                                value="specific"
                                                checked={target === 'specific'}
                                                onChange={() => setTarget('specific')}
                                                className="text-indigo-500 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white">Specific Owners</p>
                                                <p className="text-xs text-white/50">Select individual owners</p>
                                            </div>
                                        </label>

                                        {/* By plan */}
                                        <label className={clsx(
                                            'flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-all',
                                            target === 'by_plan'
                                                ? 'border-indigo-500/50 bg-indigo-500/10'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                        )}>
                                            <input
                                                type="radio"
                                                name="target"
                                                value="by_plan"
                                                checked={target === 'by_plan'}
                                                onChange={() => setTarget('by_plan')}
                                                className="text-indigo-500 focus:ring-indigo-500"
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-white">By Plan</p>
                                                <p className="text-xs text-white/50">Target owners by subscription plan</p>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Specific owners picker */}
                                {target === 'specific' && (
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="relative flex-1 mr-2">
                                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                                                <input
                                                    type="text"
                                                    value={ownerSearch}
                                                    onChange={(e) => setOwnerSearch(e.target.value)}
                                                    className="w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Search owners..."
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={selectAllOwners}
                                                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium whitespace-nowrap"
                                            >
                                                {selectedOwnerIds.length === filteredOwners.length ? 'Deselect' : 'Select all'}
                                            </button>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto rounded-lg border border-white/10 divide-y divide-white/5">
                                            {filteredOwners.length === 0 ? (
                                                <div className="text-center py-4">
                                                    <p className="text-xs text-white/40">No owners found</p>
                                                </div>
                                            ) : (
                                                filteredOwners.map((owner) => (
                                                    <label
                                                        key={owner.id}
                                                        className={clsx(
                                                            'flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/5 transition-colors',
                                                            selectedOwnerIds.includes(owner.id) && 'bg-indigo-500/10'
                                                        )}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedOwnerIds.includes(owner.id)}
                                                            onChange={() => toggleOwner(owner.id)}
                                                            className="h-4 w-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-white truncate">{owner.name}</p>
                                                            <p className="text-xs text-white/40 truncate">{owner.tenant_name} • {owner.email}</p>
                                                        </div>
                                                        <span className={clsx('inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium', planLabels[owner.plan]?.color || 'bg-gray-100 text-gray-700')}>
                                                            {planLabels[owner.plan]?.label || owner.plan}
                                                        </span>
                                                    </label>
                                                ))
                                            )}
                                        </div>
                                        {errors.recipients && <p className="mt-1 text-xs text-red-400">{errors.recipients}</p>}
                                        {selectedOwnerIds.length > 0 && (
                                            <p className="mt-1 text-xs text-white/40">
                                                {selectedOwnerIds.length} owner{selectedOwnerIds.length > 1 ? 's' : ''} selected
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Plan picker */}
                                {target === 'by_plan' && (
                                    <div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(planLabels).map(([plan, info]) => (
                                                <label
                                                    key={plan}
                                                    className={clsx(
                                                        'flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all',
                                                        selectedPlans.includes(plan)
                                                            ? 'border-indigo-500/50 bg-indigo-500/10'
                                                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                                                    )}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPlans.includes(plan)}
                                                        onChange={() => togglePlan(plan)}
                                                        className="h-4 w-4 rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-white">{info.label}</p>
                                                        <p className="text-xs text-white/40">
                                                            {planCounts[plan] || 0} tenant{(planCounts[plan] || 0) !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        {errors.plans && <p className="mt-1 text-xs text-red-400">{errors.plans}</p>}
                                    </div>
                                )}

                                {/* Estimated recipients */}
                                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <EnvelopeIcon className="h-4 w-4 text-white/40" />
                                        <span className="text-sm text-white/60">Estimated recipients:</span>
                                        <span className="text-sm font-semibold text-indigo-400">
                                            {estimatedRecipients}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="rounded-lg px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                disabled={isSending}
                                className={clsx(
                                    'flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-all',
                                    isSending
                                        ? 'bg-indigo-500/50 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/25'
                                )}
                            >
                                {isSending ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <PaperAirplaneIcon className="h-4 w-4" />
                                        Send Notification
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sent History */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20">
                            <ClockIcon className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Sent History</h2>
                            <p className="text-sm text-white/50">Previously sent notifications</p>
                        </div>
                    </div>

                    {sentHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <EnvelopeIcon className="h-10 w-10 text-white/20 mb-3" />
                            <p className="text-sm text-white/40">No notifications sent yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {sentHistory.map((item) => {
                                const typeConfig = notificationTypes.find((t) => t.value === item.type);
                                const TypeIcon = typeConfig?.icon || MegaphoneIcon;
                                const isExpanded = expandedHistoryId === item.id;

                                return (
                                    <div key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                                            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors text-left"
                                        >
                                            <div className={clsx(
                                                'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
                                                typeConfig?.color === 'indigo' ? 'bg-indigo-500/20' :
                                                    typeConfig?.color === 'red' ? 'bg-red-500/20' : 'bg-blue-500/20'
                                            )}>
                                                <TypeIcon className={clsx(
                                                    'h-4 w-4',
                                                    typeConfig?.color === 'indigo' ? 'text-indigo-400' :
                                                        typeConfig?.color === 'red' ? 'text-red-400' : 'text-blue-400'
                                                )} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{item.title}</p>
                                                <p className="text-xs text-white/40 truncate mt-0.5">{item.body}</p>
                                            </div>
                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1.5">
                                                        <UserGroupIcon className="h-3.5 w-3.5 text-white/30" />
                                                        <span className="text-xs text-white/50">{item.recipient_count}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <EyeIcon className="h-3.5 w-3.5 text-white/30" />
                                                        <span className="text-xs text-white/50">{item.read_count}/{item.recipient_count} read</span>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-white/30">{timeAgo(item.created_at)}</span>
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="px-6 pb-4 pl-20">
                                                <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={clsx(
                                                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                                                            typeConfig?.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-300' :
                                                                typeConfig?.color === 'red' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'
                                                        )}>
                                                            {typeConfig?.label || item.type}
                                                        </span>
                                                        <span className={clsx(
                                                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
                                                            item.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                                                                item.priority === 'low' ? 'bg-gray-500/20 text-gray-300' : 'bg-blue-500/20 text-blue-300'
                                                        )}>
                                                            {item.priority} priority
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-white/70">{item.body}</p>
                                                    <p className="text-xs text-white/40">
                                                        Sent by {item.sender_name} • {new Date(item.created_at).toLocaleString('en-PH')}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
