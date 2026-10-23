import { z } from "zod"

export const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28] as const

export const poLineItemSchema = z.object({
  productId: z.number().int().positive().nullable().optional(),
  productVariantId: z.number().int().positive().nullable().optional(),
  description: z.string().min(1, "Required"),
  hsnCode: z
    .string()
    .regex(/^\d{4,8}$/, "4-8 digits")
    .optional()
    .or(z.literal("")),
  unit: z.string().optional(),
  quantity: z.coerce.number().positive("Must be > 0"),
  rate: z.coerce.number().nonnegative("Cannot be negative"),
  gstRate: z.coerce.number().refine(
    (v) => (GST_RATES as readonly number[]).includes(v),
    "Not a valid GST slab"
  ),
})

export const poFormSchema = z.object({
  supplierId: z.coerce.number().positive("Supplier is required"),
  poDate: z.string().min(1, "Date is required"),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(poLineItemSchema).min(1, "At least one item required"),
})

export type POFormValues = z.infer<typeof poFormSchema>

export function todayString() {
  return new Date().toISOString().split("T")[0]
}
