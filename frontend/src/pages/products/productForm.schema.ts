import { z } from "zod"
import { GST_RATES } from "@/pages/invoices/invoiceForm.schema"

/**
 * Mirrors the server's product validation. The GST slab list is shared with the invoice
 * form so a product cannot be priced at a rate an invoice line could not carry.
 */
export const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  sku: z.string().max(50, "Max 50 characters").optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  hsnCode: z
    .string()
    .regex(/^\d{4,8}$/, "4-8 digits")
    .optional()
    .or(z.literal("")),
  unit: z.string().optional(),
  sellingPrice: z.coerce.number().nonnegative("Cannot be negative"),
  purchasePrice: z.union([z.coerce.number().nonnegative("Cannot be negative"), z.literal("")]).optional(),
  gstRate: z.coerce.number().refine(
    (v) => (GST_RATES as readonly number[]).includes(v),
    "Not a valid GST slab"
  ),
  isActive: z.boolean(),
  hasVariants: z.boolean(),
})

export type ProductFormValues = z.infer<typeof productSchema>

export const NO_CATEGORY = "none"

export const productDefaults: ProductFormValues = {
  name: "",
  sku: "",
  description: "",
  categoryId: NO_CATEGORY,
  hsnCode: "",
  unit: "",
  sellingPrice: 0,
  purchasePrice: "",
  gstRate: 18,
  isActive: true,
  hasVariants: false,
}

/** Form values → API payload. Empty strings become nulls the server can clear a column with. */
export function toProductPayload(values: ProductFormValues) {
  return {
    name: values.name,
    sku: values.sku || null,
    description: values.description || null,
    categoryId:
      values.categoryId && values.categoryId !== NO_CATEGORY
        ? Number(values.categoryId)
        : null,
    hsnCode: values.hsnCode || null,
    unit: values.unit || null,
    sellingPrice: Number(values.sellingPrice),
    purchasePrice:
      values.purchasePrice === "" || values.purchasePrice === undefined
        ? null
        : Number(values.purchasePrice),
    gstRate: Number(values.gstRate),
    isActive: values.isActive,
    hasVariants: values.hasVariants,
  }
}
