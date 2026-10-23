import { z } from "zod";

export const stockAdjustSchema = z.object({
  body: z.object({
    quantity: z.number().refine((v) => v !== 0, "Quantity cannot be zero"),
    type: z
      .enum(["adjustment", "return", "opening", "purchase"])
      .default("adjustment"),
    notes: z.string().max(500).optional(),
    variantId: z.number().int().positive().optional(),
  }),
});

export const stockSetSchema = z.object({
  body: z.object({
    quantity: z.number().min(0, "Stock cannot be negative"),
    notes: z.string().max(500).optional(),
    variantId: z.number().int().positive().optional(),
  }),
});

export const stockMovementQuerySchema = z.object({
  query: z.object({
    productId: z.coerce.number().int().positive().optional(),
    variantId: z.coerce.number().int().positive().optional(),
    type: z
      .enum(["sale", "purchase", "adjustment", "return", "opening"])
      .optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
