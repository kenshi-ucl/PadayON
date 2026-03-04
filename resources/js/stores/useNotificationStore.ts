import { create } from 'zustand';
import axios from 'axios';
import { AppNotification } from '@/types';

interface NotificationState {
    notifications: AppNotification[];
    unreadCount: number;
    isLoading: boolean;
    isInitialized: boolean;

    // Actions
    initialize: (initialCount: number) => void;
    fetchNotifications: () => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (notification: AppNotification) => void;
    deleteNotification: (id: string) => Promise<void>;
    setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    isInitialized: false,

    initialize: (initialCount: number) => {
        if (!get().isInitialized) {
            set({ unreadCount: initialCount, isInitialized: true });
        }
    },

    fetchNotifications: async () => {
        if (get().isLoading) return;
        set({ isLoading: true });
        try {
            const response = await axios.get('/notifications/get');
            set({
                notifications: response.data.notifications,
                isLoading: false,
            });
        } catch {
            set({ isLoading: false });
        }
    },

    fetchUnreadCount: async () => {
        try {
            const response = await axios.get('/notifications/unread-count');
            set({ unreadCount: response.data.count });
        } catch {
            // Silently fail - count will update on next fetch
        }
    },

    markAsRead: async (id: string) => {
        try {
            const response = await axios.post(`/notifications/mark-read/${id}`);
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n.id === id ? { ...n, read_at: new Date().toISOString() } : n
                ),
                unreadCount: response.data.unreadCount,
            }));
        } catch {
            // Silently fail
        }
    },

    markAllAsRead: async () => {
        try {
            await axios.post('/notifications/mark-all-read');
            set((state) => ({
                notifications: state.notifications.map((n) => ({
                    ...n,
                    read_at: n.read_at || new Date().toISOString(),
                })),
                unreadCount: 0,
            }));
        } catch {
            // Silently fail
        }
    },

    addNotification: (notification: AppNotification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications].slice(0, 20),
            unreadCount: state.unreadCount + 1,
        }));
    },

    deleteNotification: async (id: string) => {
        try {
            const response = await axios.delete(`/notifications/${id}`);
            set((state) => ({
                notifications: state.notifications.filter((n) => n.id !== id),
                unreadCount: response.data.unreadCount,
            }));
        } catch {
            // Silently fail
        }
    },

    setUnreadCount: (count: number) => {
        set({ unreadCount: count });
    },
}));
