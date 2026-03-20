export {
  createNotification,
  createNotificationBatch,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  clearAllRead,
} from "./notification-service";
export type {
  NotificationType,
  CreateNotificationInput,
  NotificationItem,
} from "./notification-service";

export {
  getNotificationsAction,
  getUnreadCountAction,
  markAsReadAction,
  markAllAsReadAction,
  clearAllReadAction,
} from "./notification-actions";

export {
  getEmailPreferencesAction,
  updateEmailPreferencesAction,
} from "./email-preferences-actions";
