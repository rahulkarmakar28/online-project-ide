import { create } from "zustand";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  timestamp: number;
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, "id" | "read" | "timestamp">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [
    {
      id: "1",
      title: "Welcome to CloudIDE",
      message: "Your cloud workspace is ready. Start building!",
      type: "info",
      read: false,
      timestamp: Date.now() - 60000,
    },
    {
      id: "2",
      title: "Project shared",
      message: "Alex invited you to collaborate on 'go-microservice'",
      type: "info",
      read: false,
      timestamp: Date.now() - 3600000,
    },
    {
      id: "3",
      title: "Build successful",
      message: "my-react-app built successfully in 1.24s",
      type: "success",
      read: true,
      timestamp: Date.now() - 7200000,
    },
  ],
  addNotification: (n) =>
    set((s) => ({
      notifications: [
        { ...n, id: crypto.randomUUID(), read: false, timestamp: Date.now() },
        ...s.notifications,
      ],
    })),
  markRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),
  removeNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),
  clearAll: () => set({ notifications: [] }),
}));
