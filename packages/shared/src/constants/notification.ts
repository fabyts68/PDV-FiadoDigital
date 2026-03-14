export const NOTIFICATION_TYPES = {
  STOCK_LOW: "stock.low",
  STOCK_TYPE_LOW: "stock.type_low",
  DISCOUNT_LIMIT_APPROACHING: "discount.limit_approaching",
  DISCOUNT_LIMIT_WARNING: "discount.limit_approaching",
  DISCOUNT_LIMIT_EXCEEDED: "discount.limit_exceeded",
  CASH_REGISTER_AMOUNT_REACHED: "cash_register.amount_reached",
  CASH_REGISTER_ALERT: "cash_register.amount_reached",
  REFUND_CRITICAL: "refund.critical",
  FIADO_LIMIT_APPROACHING: "fiado.limit_approaching",
  FIADO_LIMIT_WARNING: "fiado.limit_approaching",
  FIADO_LIMIT_REACHED: "fiado.limit_reached",
  FIADO_DUE_DAY_DEBT_OPEN: "fiado.due_day_debt_open",
  FIADO_OVERDUE: "fiado.overdue",
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

export const NOTIFICATION_SEVERITIES = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  INFO: "info",
} as const;
