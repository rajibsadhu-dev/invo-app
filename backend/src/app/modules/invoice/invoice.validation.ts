import { z } from "zod";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  unit: z.string().optional().nullable(),
  quantity: z.number().positive("Quantity must be positive"),
  rate: z.number().positive("Rate must be positive"),
});

const optionalFields = {
  invoiceDate: z.coerce.date().optional(),
  tax: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  receivedAmount: z.number().min(0).optional(),
  // Reference fields
  challanNo: z.string().optional().nullable(),
  vehicleNo: z.string().optional().nullable(),
  siteLocation: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  // Payment
  paymentMethod: z.enum(["cash", "bank", "upi"]).optional().nullable(),
  bankName: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  bankIfsc: z.string().optional().nullable(),
  transactionNumber: z.string().optional().nullable(),
  // Footer
  termsAndConditions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  authorizedSignatory: z.string().optional().nullable(),
};

const createInvoiceSchema = z.object({
  body: z.object({
    customerId: z.number({ message: "Customer is required" }).int().positive(),
    items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
    ...optionalFields,
  }),
});

const updateInvoiceSchema = z.object({
  body: z.object({
    customerId: z.number().int().positive().optional(),
    items: z.array(invoiceItemSchema).min(1).optional(),
    status: z.enum(["draft", "sent", "paid", "cancelled"]).optional(),
    ...optionalFields,
  }),
});

export const InvoiceValidation = { createInvoiceSchema, updateInvoiceSchema };
