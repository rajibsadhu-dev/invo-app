export type ICreateProduct = {
  name: string;
  sku?: string | null;
  description?: string | null;
  categoryId?: number | null;
  /** HSN (goods) or SAC (services) code. */
  hsnCode?: string | null;
  /** Unit of measure: pcs, kg, m, hr... */
  unit?: string | null;
  sellingPrice: number;
  purchasePrice?: number | null;
  /** Default GST percentage; an invoice line may still override it. */
  gstRate?: number;
  isActive?: boolean;
  hasVariants?: boolean;
};

export type IUpdateProduct = Partial<ICreateProduct>;

export type IProductQuery = {
  filters?: string | string[];
  search?: string;
  sort?: string;
  page?: string | number;
  limit?: string | number;
  categoryId?: string | number;
  isActive?: string | boolean;
};
