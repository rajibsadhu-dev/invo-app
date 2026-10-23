import { z } from "zod";
import { GST_RATES } from "@/app/modules/invoice/invoice.validation";

const productFields = {
  sku: z.string().max(50, "SKU must be at most 50 characters").optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  hsnCode: z
    .string()
    .regex(/^\d{4,8}$/, "HSN/SAC must be 4 to 8 digits")
    .optional()
    .nullable()
    .or(z.literal("")),
  unit: z.string().max(20, "Unit must be at most 20 characters").optional().nullable(),
  purchasePrice: z.number().nonnegative("Purchase price cannot be negative").optional().nullable(),
  /** Same slab list as invoice lines: a product that cannot be invoiced is of no use. */
  gstRate: z
    .number()
    .refine((v) => (GST_RATES as readonly number[]).includes(v), {
      message: `GST rate must be one of ${GST_RATES.join(", ")}`,
    })
    .optional(),
  isActive: z.boolean().optional(),
  hasVariants: z.boolean().optional(),
};

const createProductSchema = z.object({
  body: z.object({
    name: z.string({ error: "Name is required" }).min(2, "Name must be at least 2 characters"),
    sellingPrice: z.number({ error: "Selling price is required" }).nonnegative(
      "Selling price cannot be negative"
    ),
    ...productFields,
  }),
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    sellingPrice: z.number().nonnegative("Selling price cannot be negative").optional(),
    ...productFields,
  }),
});

export const ProductValidation = { createProductSchema, updateProductSchema };
