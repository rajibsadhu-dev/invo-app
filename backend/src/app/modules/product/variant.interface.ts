export type ICreateVariant = {
  sku?: string | null;
  name: string;
  attributes: Record<string, string>;
  sellingPrice?: number | null;
  purchasePrice?: number | null;
  isActive?: boolean;
};

export type IUpdateVariant = {
  sku?: string | null;
  name?: string;
  sellingPrice?: number | null;
  purchasePrice?: number | null;
  isActive?: boolean;
};

export type IBulkGenerateVariants = {
  attributes: Record<string, string[]>;
};
