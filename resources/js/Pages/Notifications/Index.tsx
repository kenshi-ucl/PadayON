import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import TenantLayout from '@/Layouts/TenantLayout';
import { PageProps, AppNotification } from '@/types';
import {
    BellIcon,
    MegaphoneIcon,
    ExclamationTriangleIcon,
    ClipboardDocumentCheckIcon,
    CheckIcon,
    TrashIcon,
    FunnelIcon,
    PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import axios from 'axios';
import toast from 'react-hot-toast';
import SendToTeamModal from '@/Components/SendToTeamModal';
import { useNotificationStore } from '@/stores/useNotificationStore';

interface Props extends PageProps {
    notifications: {
        data: AppNotification[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        next_page_url: string | null;
        prev_page_url: string | null;
    };
    filters: {
        type: string;
        status: string;
    };
    isOwner: boolean;
}

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
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getTypeIcon(type: string) {
    switch (type) {
        case 'alert':
            return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
        case 'task':
            return <ClipboardDocumentCheckIcon className="h-6 w-6 text-blue-500" />;
        case 'announcement':
        default:
            return <MegaphoneIcon className="h-6 w-6 text-indigo-500" />;
    }
}

function getTypeBg(type: string) {
    switch (type) {
        case 'alert':
            return 'bg-red-50';
        case 'task':
            return 'bg-blue-50';
        case 'announcement':
        default:
            return 'bg-indigo-50';
    }
}

function getTypeLabel(type: string) {
    switch (type) {
        case 'alert':
            return { label: 'Alert', color: 'bg-red-100 text-red-700' };
        case 'task':
            return { label: 'Task', color: 'bg-blue-100 text-blue-700' };
        case 'announcement':
        default:
            return { label: 'Announcement', color: 'bg-indigo-100 text-indigo-700' };
    }
}

function getPriorityBadge(priority: string) {
    switch (priority) {
        case 'high':
            return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-red-100 text-red-700">High</span>;
        case 'low':
            return <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600">Low</span>;
        default:
            return null;
    }
}

export default function NotificationsIndex() {
    const { notifications, filters, isOwner, auth } = usePage<Props>().props;
    const [activeType, setActiveType] = useState(filters.type || 'all');
    const [activeStatus, setActiveStatus] = useState(filters.status || 'all');
    const [showSendModal, setShowSendModal] = useState(false);
    const { setUnreadCount } = useNotificationStore();

    const applyFilter = (type: string, status: string) => {
        router.get(
            '/notifications',
            { type, status },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleTypeChange = (type: string) => {
        setActiveType(type);
        applyFilter(type, activeStatus);
    };

    const handleStatusChange = (status: string) => {
        setActiveStatus(status);
        applyFilter(activeType, status);
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            const response = await axios.post(`/notifications/mark-read/${id}`);
            setUnreadCount(response.data.unreadCount);
            router.reload({ only: ['notifications'] });
        } catch {
            toast.error('Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await axios.post('/notifications/mark-all-read');
            setUnreadCount(0);
            router.reload({ only: ['notifications'] });
            toast.success('All notifications marked as read');
        } catch {
            toast.error('Failed to mark all as read');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const response = await axios.delete(`/notifications/${id}`);
            setUnreadCount(response.data.unreadCount);
            router.reload({ only: ['notifications'] });
            toast.success('Notification deleted');
        } catch {
            toast.error('Failed to delete notification');
        }
    };

    const typeFilters = [
        { value: 'all', label: 'All' },
        { value: 'announcement', label: 'Announcements' },
        { value: 'alert', label: 'Alerts' },
        { value: 'task', label: 'Tasks' },
    ];

    const statusFilters = [
        { value: 'all', label: 'All' },
        { value: 'unread', label: 'Unread' },
        { value: 'read', label: 'Read' },
    ];

    return (
        <TenantLayout title="Notifications">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {notifications.total} notification{notifications.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {auth.unreadNotificationCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <CheckIcon className="h-4 w-4" />
                                Mark all read
                            </button>
                        )}
                        {isOwner && (
                            <button
                                onClick={() => setShowSendModal(true)}
                                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
                            >
                                <PaperAirplaneIcon className="h-4 w-4" />
                                Send to Team
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="flex items-center gap-1.5">
                        <FunnelIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Type:</span>
                        <div className="flex gap-1">
                            {typeFilters.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => handleTypeChange(f.value)}
                                    className={clsx(
                                        'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                                        activeType === f.value
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status:</span>
                        <div className="flex gap-1">
                            {statusFilters.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => handleStatusChange(f.value)}
                                    className={clsx(
                                        'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                                        activeStatus === f.value
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Notification List */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    {notifications.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4">
                            <BellIcon className="h-12 w-12 text-gray-300 mb-3" />
                            <p className="text-sm font-medium text-gray-500">No notifications found</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {activeType !== 'all' || activeStatus !== 'all'
                                    ? 'Try changing your filters'
                                    : 'You\'re all caught up!'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications.data.map((notification) => {
                                const typeInfo = getTypeLabel(notification.data?.type || 'announcement');
                                return (
                                    <div
                                        key={notification.id}
                                        className={clsx(
                                            'flex items-start gap-4 px-5 py-4 transition-colors',
                                            !notification.read_at && 'bg-primary-50/30'
                                        )}
                                    >
                                        <div className={clsx(
                                            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                                            getTypeBg(notification.data?.type || 'announcement')
                                        )}>
                                            {getTypeIcon(notification.data?.type || 'announcement')}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className={clsx(
                                                            'text-sm',
                                                            !notification.read_at ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                                                        )}>
                                                            {notification.data?.title || notification.title || 'Notification'}
                                                        </h4>
                                                        <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', typeInfo.color)}>
                                                            {typeInfo.label}
                                                        </span>
                                                        {getPriorityBadge(notification.data?.priority || 'normal')}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {notification.data?.body || ''}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-xs text-gray-500">
                                                            From: {notification.data?.sender_name || 'System'}
                                                        </span>
                                                        <span className="text-xs text-gray-300">•</span>
                                                        <span className="text-xs text-gray-400">
                                                            {timeAgo(notification.created_at)}
                                                        </span>
                                                        {notification.data?.source === 'admin' && (
                                                            <>
                                                                <span className="text-xs text-gray-300">•</span>
                                                                <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700">
                                                                    Platform
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    {!notification.read_at && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notification.id)}
                                                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <CheckIcon className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(notification.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {!notification.read_at && (
                                            <div className="flex-shrink-0 mt-2">
                                                <span className="block w-2.5 h-2.5 rounded-full bg-primary-500" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {notifications.last_page > 1 && (
                    <div className="flex items-center justify-between mt-6">
                        <p className="text-sm text-gray-500">
                            Page {notifications.current_page} of {notifications.last_page}
                        </p>
                        <div className="flex gap-2">
                            {notifications.prev_page_url && (
                                <Link
                                    href={notifications.prev_page_url}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Previous
                                </Link>
                            )}
                            {notifications.next_page_url && (
                                <Link
                                    href={notifications.next_page_url}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Next
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Send to Team Modal */}
            {isOwner && (
                <SendToTeamModal
                    isOpen={showSendModal}
                    onClose={() => setShowSendModal(false)}
                />
            )}
        </TenantLayout>
    );
}
