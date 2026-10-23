export type StockMovementType =
  | "sale"
  | "purchase"
  | "adjustment"
  | "return"
  | "opening";

export interface IStockAdjust {
  quantity: number;
  type?: StockMovementType;
  notes?: string;
  variantId?: number;
}

export interface IStockSet {
  quantity: number;
  notes?: string;
  variantId?: number;
}

export interface IStockMovementQuery {
  productId?: number;
  variantId?: number;
  type?: StockMovementType;
  page?: number;
  limit?: number;
}
