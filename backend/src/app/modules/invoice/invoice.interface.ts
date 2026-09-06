import { InvoiceStatus, PaymentMethod } from "@prisma/client";

export type IInvoiceItem = {
  description: string;
  hsnCode?: string | null;
  unit?: string | null;
  quantity: number;
  rate: number;
  /** GST percentage for this line. Defaults to 0 when omitted. */
  gstRate?: number;
};

type IInvoiceOptionalFields = {
  invoiceDate?: Date | string;
  discount?: number;
  receivedAmount?: number;
  // Reference fields
  challanNo?: string | null;
  vehicleNo?: string | null;
  siteLocation?: string | null;
  billingAddress?: string | null;
  referenceNumber?: string | null;
  // Payment
  paymentMethod?: PaymentMethod | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankIfsc?: string | null;
  transactionNumber?: string | null;
  // Footer
  termsAndConditions?: string | null;
  notes?: string | null;
  authorizedSignatory?: string | null;
};

/**
 * `tax` is deliberately absent: it is derived from per-line GST, never supplied by the
 * client. Accepting it would let a caller state a tax figure that contradicts the lines.
 */
export type ICreateInvoice = IInvoiceOptionalFields & {
  customerId: number;
  items: IInvoiceItem[];
};

export type IUpdateInvoice = IInvoiceOptionalFields & {
  customerId?: number;
  items?: IInvoiceItem[];
  status?: InvoiceStatus;
};

export type IInvoiceQuery = {
  status?: InvoiceStatus;
  customerId?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};
