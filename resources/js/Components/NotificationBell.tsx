import React, { Fragment, useEffect, useState, useCallback } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Popover, Transition } from '@headlessui/react';
import {
    BellIcon,
    MegaphoneIcon,
    ExclamationTriangleIcon,
    ClipboardDocumentCheckIcon,
    CheckIcon,
    PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { PageProps, AppNotification } from '@/types';
import SendToTeamModal from './SendToTeamModal';

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
    return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function getTypeIcon(type: string) {
    switch (type) {
        case 'alert':
            return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
        case 'task':
            return <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-500" />;
        case 'announcement':
        default:
            return <MegaphoneIcon className="h-5 w-5 text-indigo-500" />;
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

function getPriorityIndicator(priority: string) {
    switch (priority) {
        case 'high':
            return <span className="inline-block w-2 h-2 rounded-full bg-red-500" title="High priority" />;
        case 'low':
            return <span className="inline-block w-2 h-2 rounded-full bg-gray-300" title="Low priority" />;
        default:
            return null;
    }
}

export default function NotificationBell() {
    const { auth } = usePage<PageProps>().props;
    const {
        notifications,
        unreadCount,
        isLoading,
        initialize,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
    } = useNotificationStore();

    const [showSendModal, setShowSendModal] = useState(false);

    // Initialize with server-provided count
    useEffect(() => {
        initialize(auth.unreadNotificationCount);
    }, [auth.unreadNotificationCount, initialize]);

    // Set up real-time listener
    useEffect(() => {
        if (window.Echo && auth.user?.id) {
            const channel = window.Echo.private(`App.Models.User.${auth.user.id}`);

            channel.notification((notification: any) => {
                const appNotification: AppNotification = {
                    id: notification.id,
                    type: notification.type,
                    title: notification.title || notification.data?.title,
                    notification_type: notification.type || notification.data?.type || 'announcement',
                    priority: notification.priority || notification.data?.priority || 'normal',
                    data: {
                        title: notification.title || notification.data?.title || '',
                        body: notification.body || notification.data?.body || '',
                        type: notification.type || notification.data?.type || 'announcement',
                        priority: notification.priority || notification.data?.priority || 'normal',
                        sender_id: notification.sender_id || notification.data?.sender_id || null,
                        sender_name: notification.sender_name || notification.data?.sender_name || 'System',
                        source: notification.source || notification.data?.source || 'admin',
                    },
                    read_at: null,
                    created_at: notification.created_at || new Date().toISOString(),
                    updated_at: notification.created_at || new Date().toISOString(),
                };
                addNotification(appNotification);
            });

            return () => {
                window.Echo.leave(`App.Models.User.${auth.user.id}`);
            };
        }
    }, [auth.user?.id, addNotification]);

    // Poll for unread count every 30 seconds as fallback
    useEffect(() => {
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    const handleOpen = useCallback(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAsRead = useCallback(
        (e: React.MouseEvent, id: string) => {
            e.stopPropagation();
            markAsRead(id);
        },
        [markAsRead]
    );

    const handleMarkAllAsRead = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            markAllAsRead();
        },
        [markAllAsRead]
    );

    const displayedNotifications = notifications.slice(0, 10);

    return (
        <>
            <Popover className="relative">
                {({ open }) => (
                    <>
                        <Popover.Button
                            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 focus:outline-none relative"
                            onClick={handleOpen}
                        >
                            {open ? (
                                <BellSolidIcon className="h-6 w-6 text-primary-600" />
                            ) : (
                                <BellIcon className="h-6 w-6" />
                            )}
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </Popover.Button>

                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="opacity-0 translate-y-1"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-1"
                        >
                            <Popover.Panel className="absolute right-0 z-50 mt-3 w-96 max-w-[calc(100vw-2rem)]">
                                <div className="overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-gray-200">
                                    {/* Header */}
                                    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            Notifications
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={handleMarkAllAsRead}
                                                    className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium"
                                                >
                                                    <CheckIcon className="h-3.5 w-3.5" />
                                                    Mark all read
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notification list */}
                                    <div className="max-h-96 overflow-y-auto">
                                        {isLoading && displayedNotifications.length === 0 ? (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                                            </div>
                                        ) : displayedNotifications.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 px-4">
                                                <BellIcon className="h-10 w-10 text-gray-300 mb-2" />
                                                <p className="text-sm text-gray-500">
                                                    No notifications yet
                                                </p>
                                            </div>
                                        ) : (
                                            displayedNotifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={clsx(
                                                        'flex items-start gap-3 px-4 py-3 border-b border-gray-50 transition-colors cursor-pointer hover:bg-gray-50',
                                                        !notification.read_at && 'bg-primary-50/40'
                                                    )}
                                                    onClick={(e) => {
                                                        if (!notification.read_at) {
                                                            handleMarkAsRead(e, notification.id);
                                                        }
                                                    }}
                                                >
                                                    <div
                                                        className={clsx(
                                                            'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
                                                            getTypeBg(notification.data?.type || 'announcement')
                                                        )}
                                                    >
                                                        {getTypeIcon(notification.data?.type || 'announcement')}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            <p
                                                                className={clsx(
                                                                    'text-sm truncate',
                                                                    !notification.read_at
                                                                        ? 'font-semibold text-gray-900'
                                                                        : 'font-medium text-gray-700'
                                                                )}
                                                            >
                                                                {notification.data?.title || notification.title || 'Notification'}
                                                            </p>
                                                            {getPriorityIndicator(notification.data?.priority || 'normal')}
                                                        </div>
                                                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                                                            {notification.data?.body || ''}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] text-gray-400">
                                                                {notification.data?.sender_name || 'System'}
                                                            </span>
                                                            <span className="text-[10px] text-gray-300">•</span>
                                                            <span className="text-[10px] text-gray-400">
                                                                {timeAgo(notification.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {!notification.read_at && (
                                                        <div className="flex-shrink-0 mt-1">
                                                            <span className="block w-2 h-2 rounded-full bg-primary-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="border-t border-gray-100 px-4 py-2.5 flex items-center justify-between">
                                        <Popover.Button as={Link} href="/notifications">
                                            <span className="text-xs font-medium text-primary-600 hover:text-primary-800">
                                                View all notifications
                                            </span>
                                        </Popover.Button>

                                        {auth.user.is_owner && (
                                            <Popover.Button
                                                as="button"
                                                onClick={() => setShowSendModal(true)}
                                                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-700 transition-colors"
                                            >
                                                <PaperAirplaneIcon className="h-3.5 w-3.5" />
                                                Send to Team
                                            </Popover.Button>
                                        )}
                                    </div>
                                </div>
                            </Popover.Panel>
                        </Transition>
                    </>
                )}
            </Popover>

            {/* Send to Team Modal */}
            {auth.user.is_owner && (
                <SendToTeamModal
                    isOpen={showSendModal}
                    onClose={() => setShowSendModal(false)}
                />
            )}
        </>
    );
}
