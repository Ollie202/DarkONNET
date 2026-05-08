"use client";

import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useAccount } from "wagmi";
import { useNotifications } from "~~/components/notifications/NotificationsContext";
import { useOutsideClick } from "~~/hooks/helper";

export const NotificationsMenu = () => {
  const { address } = useAccount();
  const { notifications, unreadCount, connectWalletNotifications, markAsRead } = useNotifications();
  const dropdownRef = useRef<HTMLDetailsElement>(null);

  useOutsideClick(dropdownRef, () => dropdownRef.current?.removeAttribute("open"));

  useEffect(() => {
    connectWalletNotifications(address);
  }, [address, connectWalletNotifications]);

  return (
    <details ref={dropdownRef} className="dropdown dropdown-end relative z-[100]">
      <summary
        aria-label="notifications"
        className="smooth-action relative inline-flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-md text-[#525252] hover:bg-[#F4F4F5] hover:text-[#0A0A0A] dark:text-[#A1A1A1] dark:hover:bg-[#141414] dark:hover:text-[#FFD60A]"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#EF4444] ring-2 ring-white dark:ring-[#0A0A0A]" />
        )}
      </summary>

      <div className="dropdown-content z-[100] mt-2 w-80 max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-[#E5E5E5] bg-white shadow-[0_18px_50px_-28px_rgba(10,10,10,0.5)] dark:border-[#1F1F1F] dark:bg-[#141414]">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-4 py-3 dark:border-[#1F1F1F]">
          <h2 className="text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">Notifications</h2>
          <span className="text-xs text-[#525252] dark:text-[#A1A1A1]">{unreadCount} unread</span>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 && (
            <div className="px-4 py-6 text-sm text-[#525252] dark:text-[#A1A1A1]">
              {address ? "No Notifications yet" : "Connect wallet to load notifications."}
            </div>
          )}
          {notifications.map(notification => (
            <button
              key={notification.id}
              type="button"
              onClick={() => markAsRead(notification.id)}
              className={`smooth-action flex w-full gap-3 border-b border-[#E5E5E5] px-4 py-3 text-left last:border-b-0 hover:bg-[#F8FAFC] dark:border-[#1F1F1F] dark:hover:bg-[#0A0A0A] ${
                notification.read ? "opacity-55" : ""
              }`}
            >
              <span
                className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  notification.read ? "bg-transparent" : "bg-[#EF4444]"
                }`}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-[#0A0A0A] dark:text-[#FAFAFA]">
                  {notification.title}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#525252] dark:text-[#A1A1A1]">
                  {notification.message}
                </span>
                <span className="mt-2 block text-[11px] text-[#525252] dark:text-[#A1A1A1]">{notification.time}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </details>
  );
};
