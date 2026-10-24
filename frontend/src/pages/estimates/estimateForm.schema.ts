import { z } from "zod"

export { GST_RATES, UNIT_OPTIONS, getDefaultGstRate, saveDefaultGstRate, getDefaultUnit, saveDefaultUnit, todayString } from "../invoices/invoiceForm.schema"
import { lineItemSchema } from "../invoices/invoiceForm.schema"

export { lineItemSchema }

export const estimateFormSchema = z.object({
  customerId: z.coerce.number().positive("Customer is required"),
  estimateDate: z.string().min(1, "Date is required"),
  validUntil: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "At least one item required"),
  discount: z.coerce.number().min(0).optional(),
  challanNo: z.string().optional(),
  vehicleNo: z.string().optional(),
  siteLocation: z.string().optional(),
  billingAddress: z.string().optional(),
  referenceNumber: z.string().optional(),
  termsAndConditions: z.string().optional(),
  notes: z.string().optional(),
  authorizedSignatory: z.string().optional(),
})

export type EstimateFormValues = z.infer<typeof estimateFormSchema>
