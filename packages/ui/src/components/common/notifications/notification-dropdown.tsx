"use client";

import { useState, useCallback } from "react";
import { CheckCheck, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";
import { NotificationItem, type NotificationData } from "./notification-item";

interface NotificationDropdownProps {
  notifications: NotificationData[];
  hasMore: boolean;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onClearAllRead: () => Promise<void>;
  onLoadMore: () => void;
  isLoading?: boolean;
}

export function NotificationDropdown({
  notifications,
  hasMore,
  onMarkRead,
  onMarkAllRead,
  onClearAllRead,
  onLoadMore,
  isLoading,
}: NotificationDropdownProps) {
  const [actionLoading, setActionLoading] = useState(false);

  const handleMarkAllRead = useCallback(async () => {
    setActionLoading(true);
    try {
      await onMarkAllRead();
    } finally {
      setActionLoading(false);
    }
  }, [onMarkAllRead]);

  const handleClearAllRead = useCallback(async () => {
    setActionLoading(true);
    try {
      await onClearAllRead();
    } finally {
      setActionLoading(false);
    }
  }, [onClearAllRead]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="w-80">
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-sm font-semibold">Notifications</h3>
        <div className="flex gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleMarkAllRead}
              disabled={actionLoading}
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Read all
            </Button>
          )}
          {notifications.some((n) => n.isRead) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={handleClearAllRead}
              disabled={actionLoading}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </div>
      <Separator />
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={(id) => {
                  onMarkRead(id);
                }}
              />
            ))}
            {hasMore && (
              <div className="px-4 py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={onLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Load more"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
