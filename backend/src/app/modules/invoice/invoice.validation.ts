import { z } from "zod";

/** GST slabs in force. A free-form percentage would produce unfilable returns. */
export const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28] as const;

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  hsnCode: z
    .string()
    .regex(/^\d{4,8}$/, "HSN/SAC must be 4 to 8 digits")
    .optional()
    .nullable()
    .or(z.literal("")),
  unit: z.string().optional().nullable(),
  quantity: z.number().positive("Quantity must be positive"),
  rate: z.number().nonnegative("Rate cannot be negative"),
  gstRate: z
    .number()
    .refine((v) => (GST_RATES as readonly number[]).includes(v), {
      message: `GST rate must be one of ${GST_RATES.join(", ")}`,
    })
    .optional(),
});

const optionalFields = {
  invoiceDate: z.coerce.date().optional(),
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
