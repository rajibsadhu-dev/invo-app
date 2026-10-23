import { z } from "zod";

const poItemSchema = z.object({
  productId: z.number().int().positive(),
  productVariantId: z.number().int().positive().optional().nullable(),
  description: z.string().min(1, "Description is required"),
  hsnCode: z.string().max(8).optional().nullable(),
  unit: z.string().max(20).optional().nullable(),
  quantity: z.number().positive("Quantity must be positive"),
  rate: z.number().min(0, "Rate must be non-negative"),
  gstRate: z.number().min(0).max(100).optional(),
});

const createPOSchema = z.object({
  body: z.object({
    supplierId: z.number().int().positive(),
    poDate: z.string().optional(),
    expectedDate: z.string().optional().nullable(),
    notes: z.string().optional(),
    items: z.array(poItemSchema).min(1, "At least one item is required"),
  }),
});

const updatePOSchema = z.object({
  body: z.object({
    supplierId: z.number().int().positive().optional(),
    poDate: z.string().optional(),
    expectedDate: z.string().optional().nullable(),
    status: z.enum(["draft", "ordered", "partially_received", "received", "cancelled"]).optional(),
    notes: z.string().optional(),
    items: z.array(poItemSchema).min(1).optional(),
  }),
});

const receivePOSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        itemId: z.number().int().positive(),
        quantity: z.number().positive("Receive quantity must be positive"),
      })
    ).min(1, "At least one item must be received"),
  }),
});

export const PurchaseOrderValidation = { createPOSchema, updatePOSchema, receivePOSchema };
