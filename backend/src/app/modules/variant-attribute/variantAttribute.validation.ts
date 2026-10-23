import { z } from "zod";

const createVariantAttributeSchema = z.object({
  body: z.object({
    name: z
      .string({ error: "Attribute name is required" })
      .min(1, "Attribute name is required")
      .max(50, "Attribute name must be at most 50 characters"),
    values: z
      .array(z.string().min(1, "Value cannot be empty").max(100))
      .min(1, "At least one value is required")
      .max(100, "At most 100 values allowed"),
  }),
});

const updateVariantAttributeSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(50).optional(),
    values: z
      .array(z.string().min(1).max(100))
      .min(1, "At least one value is required")
      .max(100)
      .optional(),
  }),
});

export const VariantAttributeValidation = {
  createVariantAttributeSchema,
  updateVariantAttributeSchema,
};
