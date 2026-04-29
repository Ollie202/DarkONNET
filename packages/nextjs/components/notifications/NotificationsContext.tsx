"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

type NotificationsContextValue = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "read">) => void;
  markAsRead: (id: string) => void;
};

const initialNotifications: Notification[] = [
  {
    id: "notif-1",
    title: "Reply On Your Comment",
    message: "0x44...91cB replied to your take on the Fed rates market.",
    time: "2m ago",
    read: false,
  },
  {
    id: "notif-2",
    title: "Market Moving",
    message: "BTC above $150k moved 4% toward Yes in the last hour.",
    time: "18m ago",
    read: false,
  },
  {
    id: "notif-3",
    title: "Comment Liked",
    message: "Someone liked your comment on the oil market.",
    time: "42m ago",
    read: false,
  },
  {
    id: "notif-4",
    title: "Resolution Soon",
    message: "NBA Finals East market is approaching its resolution window.",
    time: "1h ago",
    read: true,
  },
  {
    id: "notif-5",
    title: "New Discussion",
    message: "A new thread started on the AI stocks correction market.",
    time: "3h ago",
    read: true,
  },
];

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const addNotification = useCallback((notification: Omit<Notification, "id" | "read">) => {
    setNotifications(prev => [
      {
        ...notification,
        id: `notif-${Date.now()}`,
        read: false,
      },
      ...prev,
    ]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification => (notification.id === id ? { ...notification, read: true } : notification)),
    );
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter(notification => !notification.read).length,
      addNotification,
      markAsRead,
    }),
    [addNotification, markAsRead, notifications],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
};
