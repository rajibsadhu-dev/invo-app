import { z } from "zod";

const createCategorySchema = z.object({
  body: z.object({
    name: z.string({ error: "Name is required" }).min(2, "Name must be at least 2 characters"),
    description: z.string().optional().nullable(),
    parentId: z.number().int().positive().optional().nullable(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    description: z.string().optional().nullable(),
    parentId: z.number().int().positive().optional().nullable(),
    sortOrder: z.number().int().min(0).optional(),
  }),
});

export const CategoryValidation = { createCategorySchema, updateCategorySchema };
