import { z } from "zod"

// ─── Schema ───────────────────────────────────────────────────────────────────

export const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28] as const

export const lineItemSchema = z.object({
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

export const invoiceFormSchema = z.object({
  customerId: z.coerce.number().positive("Customer is required"),
  invoiceDate: z.string().min(1, "Date is required"),
  items: z.array(lineItemSchema).min(1, "At least one item required"),
  discount: z.coerce.number().min(0).optional(),
  receivedAmount: z.coerce.number().min(0).optional(),
  // Reference fields
  challanNo: z.string().optional(),
  vehicleNo: z.string().optional(),
  siteLocation: z.string().optional(),
  billingAddress: z.string().optional(),
  referenceNumber: z.string().optional(),
  // Payment
  paymentMethod: z.enum(["cash", "bank", "upi"]).optional().nullable(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  bankIfsc: z.string().optional(),
  transactionNumber: z.string().optional(),
  // Footer
  termsAndConditions: z.string().optional(),
  notes: z.string().optional(),
  authorizedSignatory: z.string().optional(),
})

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>

export const UNIT_OPTIONS = ["pcs", "nos", "kg", "ton", "ltr", "m", "sqft", "rft", "box", "set", "hr"]

const GST_KEY = "invo_default_gst_rate"
export const getDefaultGstRate = () => Number(localStorage.getItem(GST_KEY) ?? 18)
export const saveDefaultGstRate = (rate: number) =>
  localStorage.setItem(GST_KEY, String(rate))

const UNIT_KEY = "invo_default_unit"
export const getDefaultUnit = () => localStorage.getItem(UNIT_KEY) ?? ""
export const saveDefaultUnit = (unit: string) => {
  if (unit) localStorage.setItem(UNIT_KEY, unit)
  else localStorage.removeItem(UNIT_KEY)
}

export function todayString() {
  return new Date().toISOString().split("T")[0]
}
