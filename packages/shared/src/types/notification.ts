export type NotificationSeverity = "critical" | "high" | "medium" | "info";

export type Notification = {
  id: string;
  type: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  meta: string | null;
  target_roles: string; // JSON serializado
  read_at: string | null;
  acknowledged_by: string | null;
  created_at: string;
};

export type CreateNotificationPayload = {
  type: string;
  severity: NotificationSeverity;
  title: string;
  message: string;
  meta?: string;
  target_roles: string[];
};
