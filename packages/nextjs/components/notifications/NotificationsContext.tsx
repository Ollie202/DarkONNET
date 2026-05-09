"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type ApiNotification } from "~~/lib/darkonnetApi";
import { createClient } from "~~/utils/supabase/client";

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

const mapNotification = (notification: any): Notification => ({
  id: notification.id,
  title: notification.title,
  message: notification.body,
  time: relativeTime(notification.created_at || notification.createdAt),
  read: Boolean(notification.read_at || notification.readAt),
});

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [walletAddress, setWalletAddress] = useState("");
  const supabase = useMemo(() => createClient(), []);

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

  const connectWalletNotifications = useCallback(
    (address?: string) => {
      const normalizedAddress = address?.toLowerCase() || "";
      setWalletAddress(normalizedAddress);

      if (!normalizedAddress) {
        setNotifications([]);
        return;
      }

      let active = true;
      const channel = supabase
        .channel(`notifications:${normalizedAddress}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `wallet_address=eq.${normalizedAddress}`,
          },
          (payload: { new: Record<string, unknown> }) => {
            if (active) setNotifications(prev => [mapNotification(payload.new), ...prev]);
          },
        )
        .subscribe();

      supabase
        .from("notifications")
        .select("*")
        .eq("wallet_address", normalizedAddress)
        .order("created_at", { ascending: false })
        .then(({ data: initialNotifs }) => {
          if (active && initialNotifs) setNotifications(initialNotifs.map(mapNotification));
        });

      return () => {
        active = false;
        supabase.removeChannel(channel);
      };
    },
    [supabase],
  );

  const markAsRead = useCallback(
    async (id: string) => {
      if (walletAddress) {
        // Update in Supabase
        await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
      }
      setNotifications(prev =>
        prev.map(notification => (notification.id === id ? { ...notification, read: true } : notification)),
      );
    },
    [walletAddress, supabase],
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
