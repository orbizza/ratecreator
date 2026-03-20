"use client";

import {
  MessageSquare,
  ThumbsUp,
  Shield,
  Send,
  UserCheck,
  Newspaper,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@ratecreator/ui/utils";

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: unknown;
  isRead: boolean;
  createdAt: Date;
}

const ICON_MAP: Record<string, { icon: LucideIcon; className: string }> = {
  REVIEW_REPLY: { icon: MessageSquare, className: "text-blue-500" },
  COMMENT_REPLY: { icon: MessageSquare, className: "text-blue-400" },
  VOTE_MILESTONE: { icon: ThumbsUp, className: "text-green-500" },
  ACCOUNT_CLAIMED: { icon: UserCheck, className: "text-purple-500" },
  ACCOUNT_SUBMITTED: { icon: Send, className: "text-orange-500" },
  SUBMISSION_APPROVED: { icon: Shield, className: "text-emerald-500" },
  NEWSLETTER_NEW: { icon: Newspaper, className: "text-pink-500" },
  SYSTEM: { icon: Bell, className: "text-yellow-500" },
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

interface NotificationItemProps {
  notification: NotificationData;
  onMarkRead: (id: string) => void;
}

export function NotificationItem({
  notification,
  onMarkRead,
}: NotificationItemProps) {
  const iconConfig = ICON_MAP[notification.type] || ICON_MAP.SYSTEM;
  const Icon = iconConfig.icon;

  return (
    <button
      onClick={() => !notification.isRead && onMarkRead(notification.id)}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50",
        !notification.isRead && "bg-accent/20",
      )}
    >
      <div className={cn("mt-0.5 shrink-0", iconConfig.className)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-tight",
            !notification.isRead ? "font-medium" : "text-muted-foreground",
          )}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>
      {!notification.isRead && (
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </button>
  );
}
