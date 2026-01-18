/**
 * Notification Types
 * Types for notification system
 */

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "kyc_update"
  | "dataset_update"
  | "payment"
  | "system";

export type NotificationPriority = "low" | "medium" | "high" | "urgent";

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notifyOnKYCUpdate: boolean;
  notifyOnDatasetUpdate: boolean;
  notifyOnPayment: boolean;
  notifyOnSystemUpdates: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string; // HH:mm format
}

export interface NotificationFilter {
  types?: NotificationType[];
  priority?: NotificationPriority[];
  read?: boolean;
  dateFrom?: string;
  dateTo?: string;
}
