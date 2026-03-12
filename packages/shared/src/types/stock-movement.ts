export type StockMovementType = "entry" | "sale" | "adjustment";

export type StockMovement = {
  id: string;
  product_id: string;
  type: StockMovementType;
  quantity: number;
  unit_cost_cents: number;
  description: string | null;
  operator_id: string;
  created_at: string;
};
