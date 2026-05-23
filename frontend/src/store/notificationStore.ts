import { create } from "zustand";
import { listNotificationsApi, markReadApi, markAllReadApi, deleteNotificationApi, clearAllApi } from "../apis/notifications";

export interface Notification {
    id: string; title: string; message: string;
    type: "info" | "success" | "warning" | "error";
    read: boolean; createdAt: string;
}

interface NotificationStore {
    notifications: Notification[]; loading: boolean;
    fetchNotifications: () => Promise<void>;
    markRead:           (id: string) => Promise<void>;
    markAllRead:        () => Promise<void>;
    removeNotification: (id: string) => Promise<void>;
    clearAll:           () => Promise<void>;
    addLocal:           (n: Omit<Notification, "id" | "read" | "createdAt">) => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
    notifications: [], loading: false,

    fetchNotifications: async () => {
        set({ loading: true });
        try { const res = await listNotificationsApi(); if (res.success) set({ notifications: res.data }); }
        catch {} finally { set({ loading: false }); }
    },

    markRead: async (id) => {
        set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
        await markReadApi(id).catch(() => {});
    },

    markAllRead: async () => {
        set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) }));
        await markAllReadApi().catch(() => {});
    },

    removeNotification: async (id) => {
        set(s => ({ notifications: s.notifications.filter(n => n.id !== id) }));
        await deleteNotificationApi(id).catch(() => {});
    },

    clearAll: async () => {
        set({ notifications: [] });
        await clearAllApi().catch(() => {});
    },

    addLocal: (n) => set(s => ({
        notifications: [{ ...n, id: crypto.randomUUID(), read: false, createdAt: new Date().toISOString() }, ...s.notifications],
    })),
}));