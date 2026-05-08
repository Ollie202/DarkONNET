"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { type ApiNotification, darkonnetApi } from "~~/lib/darkonnetApi";

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
  connectWalletNotifications: (walletAddress?: string) => void;
  markAsRead: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const relativeTime = (date: string) => {
  const diffMs = Date.now() - new Date(date).getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "Just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const mapNotification = (notification: ApiNotification): Notification => ({
  id: notification.id,
  title: notification.title,
  message: notification.body,
  time: relativeTime(notification.createdAt),
  read: Boolean(notification.readAt),
});

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [walletAddress, setWalletAddress] = useState("");
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    return () => socketRef.current?.close();
  }, []);

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

  const connectWalletNotifications = useCallback((address?: string) => {
    const normalizedAddress = address?.toLowerCase() || "";
    setWalletAddress(normalizedAddress);
    socketRef.current?.close();
    socketRef.current = null;

    if (!normalizedAddress) {
      setNotifications([]);
      return;
    }

    const connect = async () => {
      const nextNotifications = await darkonnetApi.listNotifications(normalizedAddress);
      setNotifications(nextNotifications.map(mapNotification));

      const socket = new WebSocket(await darkonnetApi.authenticatedWsNotificationsUrl(normalizedAddress));
      socketRef.current = socket;
      socket.addEventListener("message", event => {
        try {
          const payload = JSON.parse(event.data) as { type?: string; notification?: ApiNotification };
          if (payload.type === "notification.created" && payload.notification) {
            setNotifications(prev => [mapNotification(payload.notification as ApiNotification), ...prev]);
          }
        } catch {
          // Ignore malformed websocket messages.
        }
      });
    };

    connect().catch(() => setNotifications([]));
  }, []);

  const markAsRead = useCallback(
    (id: string) => {
      if (walletAddress) {
        darkonnetApi.markNotificationRead(walletAddress, id).catch(() => {});
      }
      setNotifications(prev =>
        prev.map(notification => (notification.id === id ? { ...notification, read: true } : notification)),
      );
    },
    [walletAddress],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: notifications.filter(notification => !notification.read).length,
      addNotification,
      connectWalletNotifications,
      markAsRead,
    }),
    [addNotification, connectWalletNotifications, markAsRead, notifications],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
};
