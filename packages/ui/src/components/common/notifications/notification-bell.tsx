"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { Button } from "../../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { NotificationDropdown } from "./notification-dropdown";
import type { NotificationData } from "./notification-item";

const POLL_INTERVAL_MS = 120_000; // 2 minutes

interface NotificationBellProps {
  getUnreadCount: () => Promise<number>;
  getNotifications: (options: { page?: number; limit?: number }) => Promise<{
    notifications: NotificationData[];
    total: number;
    hasMore: boolean;
  }>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<number>;
  clearAllRead: () => Promise<number>;
}

export function NotificationBell({
  getUnreadCount,
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllRead,
}: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Poll unread count
  useEffect(() => {
    let mounted = true;

    const fetchCount = async () => {
      try {
        const count = await getUnreadCount();
        if (mounted) setUnreadCount(count);
      } catch {
        // Silently fail — not critical
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [getUnreadCount]);

  // Fetch notifications when popover opens
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    const fetchNotifs = async () => {
      setIsLoading(true);
      try {
        const result = await getNotifications({ page: 1, limit: 20 });
        if (mounted) {
          setNotifications(result.notifications);
          setHasMore(result.hasMore);
          setPage(1);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchNotifs();
    return () => {
      mounted = false;
    };
  }, [isOpen, getNotifications]);

  const handleLoadMore = useCallback(async () => {
    const nextPage = page + 1;
    setIsLoading(true);
    try {
      const result = await getNotifications({ page: nextPage, limit: 20 });
      setNotifications((prev) => [...prev, ...result.notifications]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    } finally {
      setIsLoading(false);
    }
  }, [page, getNotifications]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    },
    [markAsRead],
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, [markAllAsRead]);

  const handleClearAllRead = useCallback(async () => {
    await clearAllRead();
    setNotifications((prev) => prev.filter((n) => !n.isRead));
  }, [clearAllRead]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        <NotificationDropdown
          notifications={notifications}
          hasMore={hasMore}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
          onClearAllRead={handleClearAllRead}
          onLoadMore={handleLoadMore}
          isLoading={isLoading}
        />
      </PopoverContent>
    </Popover>
  );
}
