import { InvoiceStatus, PaymentMethod } from "@prisma/client";

export type IInvoiceItem = {
  description: string;
  unit?: string | null;
  quantity: number;
  rate: number;
};

export type ICreateInvoice = {
  customerId: number;
  invoiceDate?: Date | string;
  items: IInvoiceItem[];
  tax?: number;
  discount?: number;
  receivedAmount?: number;
  // Reference fields
  challanNo?: string;
  vehicleNo?: string;
  siteLocation?: string;
  billingAddress?: string;
  referenceNumber?: string;
  // Payment
  paymentMethod?: PaymentMethod | null;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  transactionNumber?: string;
  // Footer
  termsAndConditions?: string;
  notes?: string;
  authorizedSignatory?: string;
};

export type IUpdateInvoice = {
  customerId?: number;
  invoiceDate?: Date | string;
  items?: IInvoiceItem[];
  tax?: number;
  discount?: number;
  receivedAmount?: number;
  status?: InvoiceStatus;
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

export type IInvoiceQuery = {
  status?: InvoiceStatus;
  customerId?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};
