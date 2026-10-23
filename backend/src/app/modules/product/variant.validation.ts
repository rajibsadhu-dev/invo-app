import { z } from "zod";

const createVariantSchema = z.object({
  body: z.object({
    sku: z.string().max(50).optional().nullable(),
    name: z
      .string({ error: "Variant name is required" })
      .min(1, "Variant name is required")
      .max(191),
    attributes: z
      .record(z.string(), z.string())
      .refine((obj) => Object.keys(obj).length > 0, {
        message: "At least one attribute is required",
      }),
    sellingPrice: z.number().nonnegative().optional().nullable(),
    purchasePrice: z.number().nonnegative().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

const updateVariantSchema = z.object({
  body: z.object({
    sku: z.string().max(50).optional().nullable(),
    name: z.string().min(1).max(191).optional(),
    sellingPrice: z.number().nonnegative().optional().nullable(),
    purchasePrice: z.number().nonnegative().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

const bulkGenerateSchema = z.object({
  body: z.object({
    attributes: z
      .record(
        z.string(),
        z.array(z.string().min(1)).min(1, "Each attribute needs at least one value")
      )
      .refine((obj) => Object.keys(obj).length > 0, {
        message: "At least one attribute is required",
      })
      .refine((obj) => {
        const combos = Object.values(obj).reduce((n, v) => n * v.length, 1);
        return combos <= 200;
      }, { message: "Too many combinations (max 200)" }),
  }),
});

export const VariantValidation = {
  createVariantSchema,
  updateVariantSchema,
  bulkGenerateSchema,
};
