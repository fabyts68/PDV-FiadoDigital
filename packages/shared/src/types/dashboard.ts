export interface DashboardSummary {
  financial: {
    total_sales_cents: number;
    total_sales_count: number;
    average_ticket_cents: number;
    cancellations_count: number;
    cancellations_total_cents: number;
    discount_total_cents: number;
    discount_occurrences: number;
    by_payment_method: Record<string, number>;
  };
  financial_yesterday: {
    total_sales_cents: number;
    total_sales_count: number;
    average_ticket_cents: number;
  };
  stock_alerts: Array<{
    product_id: string;
    product_name: string;
    stock_quantity: number;
    min_stock_alert: number;
    is_bulk: boolean;
    product_type_name: string;
  }>;
  overdue_customers: Array<{
    customer_id: string;
    customer_name: string;
    phone: string | null;
    current_debt_cents: number;
    payment_due_day: number | null;
  }>;
  unread_notifications_count: number;
  critical_notifications: Array<{
    id: string;
    type: string;
    severity: string;
    title: string;
    message: string;
    meta: string | null;
    created_at: string;
  }>;
  open_cash_register: {
    id: string;
    opened_at: string;
    operator_name: string;
    initial_amount_cents: number;
    current_balance_cents: number;
  } | null;
}
