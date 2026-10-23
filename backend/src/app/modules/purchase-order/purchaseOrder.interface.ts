export type POStatus =
  | "draft"
  | "ordered"
  | "partially_received"
  | "received"
  | "cancelled";

export type IPOItemInput = {
  productId: number;
  productVariantId?: number | null;
  description: string;
  hsnCode?: string | null;
  unit?: string | null;
  quantity: number;
  rate: number;
  gstRate?: number;
};

export type ICreatePurchaseOrder = {
  supplierId: number;
  poDate?: string;
  expectedDate?: string | null;
  notes?: string;
  items: IPOItemInput[];
};

export type IUpdatePurchaseOrder = {
  supplierId?: number;
  poDate?: string;
  expectedDate?: string | null;
  status?: POStatus;
  notes?: string;
  items?: IPOItemInput[];
};

export type IReceiveItem = {
  itemId: number;
  quantity: number;
};

export type IPurchaseOrderQuery = {
  filters?: string | string[];
  search?: string;
  sort?: string;
  page?: string | number;
  limit?: string | number;
};
