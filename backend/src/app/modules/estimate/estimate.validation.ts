import { z } from "zod";
import { GST_RATES } from "../invoice/invoice.validation";

const estimateItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  productId: z.number().int().positive().optional().nullable(),
  productVariantId: z.number().int().positive().optional().nullable(),
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
  estimateDate: z.coerce.date().optional(),
  validUntil: z.coerce.date().optional().nullable(),
  discount: z.number().min(0).optional(),
  challanNo: z.string().optional().nullable(),
  vehicleNo: z.string().optional().nullable(),
  siteLocation: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  termsAndConditions: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  authorizedSignatory: z.string().optional().nullable(),
};

const createEstimateSchema = z.object({
  body: z.object({
    customerId: z.number({ message: "Customer is required" }).int().positive(),
    items: z.array(estimateItemSchema).min(1, "At least one item is required"),
    ...optionalFields,
  }),
});

const updateEstimateSchema = z.object({
  body: z.object({
    customerId: z.number().int().positive().optional(),
    items: z.array(estimateItemSchema).min(1).optional(),
    status: z
      .enum(["draft", "sent", "accepted", "rejected", "expired", "converted", "cancelled"])
      .optional(),
    ...optionalFields,
  }),
});

const sendEstimateSchema = z.object({
  body: z.object({
    to: z.string().email("Valid email address is required"),
    subject: z.string().min(1, "Subject is required").max(500),
    message: z.string().min(1, "Message is required").max(5000),
  }),
});

const updateEstimateStatusSchema = z.object({
  body: z.object({
    status: z.enum(["accepted", "rejected", "cancelled"]),
  }),
});

export const EstimateValidation = {
  createEstimateSchema,
  updateEstimateSchema,
  sendEstimateSchema,
  updateEstimateStatusSchema,
};
