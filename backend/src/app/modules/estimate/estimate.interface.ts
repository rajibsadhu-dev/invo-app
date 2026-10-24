import { EstimateStatus, OrgRole } from "@prisma/client";

export type IEstimateItem = {
  description: string;
  productId?: number | null;
  productVariantId?: number | null;
  hsnCode?: string | null;
  unit?: string | null;
  quantity: number;
  rate: number;
  gstRate?: number;
};

type IEstimateOptionalFields = {
  estimateDate?: Date | string;
  validUntil?: Date | string | null;
  discount?: number;
  challanNo?: string | null;
  vehicleNo?: string | null;
  siteLocation?: string | null;
  billingAddress?: string | null;
  referenceNumber?: string | null;
  termsAndConditions?: string | null;
  notes?: string | null;
  authorizedSignatory?: string | null;
};

export type ICreateEstimate = IEstimateOptionalFields & {
  customerId: number;
  items: IEstimateItem[];
};

export type IUpdateEstimate = IEstimateOptionalFields & {
  customerId?: number;
  items?: IEstimateItem[];
  status?: EstimateStatus;
};

export type IEstimateQuery = {
  filters?: string | string[];
  search?: string;
  sort?: string;
  page?: string | number;
  limit?: string | number;
  orgRole?: OrgRole;
  userId?: number;
};
