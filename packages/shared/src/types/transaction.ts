export type TransactionType =
  | "sale"
  | "refund"
  | "cancellation"
  | "cash_in"
  | "cash_out"
  | "fiado_payment";

export type Transaction = {
  id: string;
  type: TransactionType;
  amount_cents: number;
  sale_id: string | null;
  customer_id: string | null;
  cash_register_id: string;
  operator_id: string;
  debt_before_cents: number | null;
  description: string | null;
  created_at: string;
};
