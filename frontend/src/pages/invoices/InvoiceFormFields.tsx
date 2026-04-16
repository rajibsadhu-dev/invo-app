import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form"
import { PlusIcon, Trash2 } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { InvoCombobox } from "@/components/form"
import type { Option } from "@/components/form"

// ─── Schema ───────────────────────────────────────────────────────────────────

export const lineItemSchema = z.object({
  description: z.string().min(1, "Required"),
  unit: z.string().optional(),
  quantity: z.coerce.number().positive("Must be > 0"),
  rate: z.coerce.number().positive("Must be > 0"),
})

export const invoiceFormSchema = z.object({
  customerId: z.coerce.number().positive("Customer is required"),
  invoiceDate: z.string().min(1, "Date is required"),
  items: z.array(lineItemSchema).min(1, "At least one item required"),
  tax: z.coerce.number().min(0).optional(),
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

const UNIT_OPTIONS = ["pcs", "nos", "kg", "ton", "ltr", "m", "sqft", "rft", "box", "set", "hr"]

const UNIT_KEY = "invo_default_unit"
const getDefaultUnit = () => localStorage.getItem(UNIT_KEY) ?? ""
const saveDefaultUnit = (unit: string) => {
  if (unit) localStorage.setItem(UNIT_KEY, unit)
  else localStorage.removeItem(UNIT_KEY)
}

export function todayString() {
  return new Date().toISOString().split("T")[0]
}

// ─── Amount in words ──────────────────────────────────────────────────────────

const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen"]
const tensArr = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

function chunkToWords(n: number): string {
  if (n === 0) return ""
  if (n < 20) return ones[n]
  if (n < 100) return tensArr[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "")
  return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + chunkToWords(n % 100) : "")
}

export function amountInWords(amount: number): string {
  if (amount <= 0) return "Zero Only"
  const int = Math.floor(amount)
  const dec = Math.round((amount - int) * 100)
  const groups = [
    { d: 1_000_000_000, l: "Billion" }, { d: 1_000_000, l: "Million" },
    { d: 1_000, l: "Thousand" }, { d: 1, l: "" },
  ]
  let words = ""
  let rem = int
  for (const { d, l } of groups) {
    if (rem >= d) {
      words += (words ? " " : "") + chunkToWords(Math.floor(rem / d)) + (l ? " " + l : "")
      rem %= d
    }
  }
  if (dec > 0) words += " and " + chunkToWords(dec) + " Paise"
  return words + " Only"
}

// ─── Field helpers ────────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-sm font-medium">
      {children}{required && <span className="ml-0.5 text-destructive">*</span>}
    </label>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  form: UseFormReturn<InvoiceFormValues>
  customerOptions: Option[]
  isSubmitting: boolean
  submitLabel: string
}

export function InvoiceFormFields({ form, customerOptions, isSubmitting, submitLabel }: Props) {
  const { control, register, watch, formState: { errors } } = form

  const { fields, append, remove } = useFieldArray({ control, name: "items" })

  const watchedItems = useWatch({ control, name: "items" }) ?? []
  const watchedTax = useWatch({ control, name: "tax" }) ?? 0
  const watchedDiscount = useWatch({ control, name: "discount" }) ?? 0
  const watchedReceived = useWatch({ control, name: "receivedAmount" }) ?? 0
  const paymentMethod = watch("paymentMethod")

  const subtotal = watchedItems.reduce((sum, item) => {
    return sum + (Number(item?.quantity) || 0) * (Number(item?.rate) || 0)
  }, 0)
  const grandTotal = Math.max(0, subtotal + Number(watchedTax) - Number(watchedDiscount))
  const balanceDue = Math.max(0, grandTotal - Number(watchedReceived))

  return (
    <div className="flex flex-col gap-6">

      {/* ── Customer + Invoice Date ── */}
      <div className="grid grid-cols-2 gap-4">
        <InvoCombobox
          control={control}
          name="customerId"
          label="Customer"
          options={customerOptions}
          placeholder="Select a customer"
          searchPlaceholder="Search customers…"
          emptyText="No customers found"
          required
        />
        <div className="flex flex-col gap-1.5">
          <FieldLabel required>Invoice Date</FieldLabel>
          <Input type="date" {...register("invoiceDate")} />
          {errors.invoiceDate && (
            <p className="text-xs text-destructive">{errors.invoiceDate.message}</p>
          )}
        </div>
      </div>

      {/* ── Line Items ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <FieldLabel>Items</FieldLabel>
          <Button
            type="button" size="sm" variant="outline"
            onClick={() => append({ description: "", unit: getDefaultUnit(), quantity: 1, rate: 0 })}
          >
            <PlusIcon className="h-3.5 w-3.5" /> Add Item
          </Button>
        </div>

        {errors.items?.root && (
          <p className="text-xs text-destructive">{errors.items.root.message}</p>
        )}

        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
                <th className="w-20 px-3 py-2 text-left font-medium text-muted-foreground">Unit</th>
                <th className="w-20 px-3 py-2 text-left font-medium text-muted-foreground">Qty</th>
                <th className="w-28 px-3 py-2 text-left font-medium text-muted-foreground">Rate (₹)</th>
                <th className="w-28 px-3 py-2 text-right font-medium text-muted-foreground">Amount (₹)</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {fields.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No items yet — click "Add Item"
                  </td>
                </tr>
              )}
              {fields.map((field, index) => {
                const qty = Number(watchedItems[index]?.quantity) || 0
                const rate = Number(watchedItems[index]?.rate) || 0
                return (
                  <tr key={field.id}>
                    <td className="px-3 py-1.5">
                      <Input
                        {...register(`items.${index}.description`)}
                        placeholder="Item description"
                        className="h-8 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
                      />
                      {errors.items?.[index]?.description && (
                        <p className="text-xs text-destructive">{errors.items[index]!.description!.message}</p>
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      {(() => {
                        const unitReg = register(`items.${index}.unit`)
                        return (
                          <select
                            {...unitReg}
                            onChange={(e) => {
                              unitReg.onChange(e)
                              saveDefaultUnit(e.target.value)
                            }}
                            className="h-8 w-full border-0 bg-white text-black px-2 text-sm outline-none focus:ring-0 cursor-pointer"
                          >
                            <option value="">—</option>
                            {UNIT_OPTIONS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        )
                      })()}
                    </td>
                    <td className="px-3 py-1.5">
                      <Input
                        {...register(`items.${index}.quantity`)}
                        type="number" min="0" step="any" placeholder="1"
                        className="h-8 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <Input
                        {...register(`items.${index}.rate`)}
                        type="number" min="0" step="any" placeholder="0.00"
                        className="h-8 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
                      />
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium">
                      ₹ {(qty * rate).toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5">
                      <Button
                        type="button" variant="ghost" size="icon-sm"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tax & Discount ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>GST / Tax (₹)</FieldLabel>
          <Input {...register("tax")} type="number" min="0" step="any" placeholder="0.00" />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Discount (₹)</FieldLabel>
          <Input {...register("discount")} type="number" min="0" step="any" placeholder="0.00" />
        </div>
      </div>

      {/* ── Totals Summary ── */}
      <div className="rounded-lg border bg-muted/20 p-4">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST / Tax</span>
            <span>+ ₹ {Number(watchedTax || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span>− ₹ {Number(watchedDiscount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-1.5 font-semibold text-base">
            <span>Grand Total</span>
            <span>₹ {grandTotal.toFixed(2)}</span>
          </div>
        </div>
        {grandTotal > 0 && (
          <p className="mt-2 text-xs text-muted-foreground italic">{amountInWords(grandTotal)}</p>
        )}
      </div>

      {/* ── Additional Details ── */}
      <SectionHeading>Additional Details</SectionHeading>

      <div className="grid grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Challan No.</FieldLabel>
          <Input {...register("challanNo")} placeholder="e.g. CH-001" />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Vehicle No.</FieldLabel>
          <Input {...register("vehicleNo")} placeholder="e.g. WB 01 AB 1234" />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Site / Delivery Location</FieldLabel>
          <Input {...register("siteLocation")} placeholder="Delivery site or location" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Billing Address</FieldLabel>
          <Input {...register("billingAddress")} placeholder="If different from customer address" />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>PO / Reference No.</FieldLabel>
          <Input {...register("referenceNumber")} placeholder="e.g. PO-2024-001" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Terms & Conditions</FieldLabel>
        <Textarea
          {...register("termsAndConditions")}
          placeholder="e.g. Payment due within 30 days. Goods once sold will not be returned."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Notes / Remarks</FieldLabel>
          <Textarea {...register("notes")} placeholder="Any additional notes" rows={2} />
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Authorized Signatory</FieldLabel>
          <Input {...register("authorizedSignatory")} placeholder="Name for signature line" />
        </div>
      </div>

      {/* ── Payment Info ── */}
      <SectionHeading>Payment</SectionHeading>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Received Amount (₹)</FieldLabel>
          <Input
            {...register("receivedAmount")}
            type="number" min="0" step="any" placeholder="0.00"
          />
        </div>
        <div className="flex flex-col gap-1.5 pt-1">
          <FieldLabel>Payment Method</FieldLabel>
          <RadioGroup
            value={paymentMethod ?? ""}
            onValueChange={(v) =>
              form.setValue("paymentMethod", v === "" ? null : (v as "cash" | "bank" | "upi"))
            }
            className="flex gap-4 pt-1"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="cash" id="pm-cash" />
              <Label htmlFor="pm-cash">Cash</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="bank" id="pm-bank" />
              <Label htmlFor="pm-bank">Bank</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="upi" id="pm-upi" />
              <Label htmlFor="pm-upi">UPI / Online</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {paymentMethod === "bank" && (
        <div className="grid grid-cols-3 gap-4 rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Bank Name</FieldLabel>
            <Input {...register("bankName")} placeholder="e.g. State Bank of India" />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Account No.</FieldLabel>
            <Input {...register("bankAccount")} placeholder="Account number" />
          </div>
          <div className="flex flex-col gap-1.5">
            <FieldLabel>IFSC Code</FieldLabel>
            <Input {...register("bankIfsc")} placeholder="e.g. SBIN0001234" />
          </div>
        </div>
      )}

      {paymentMethod === "upi" && (
        <div className="rounded-lg border bg-muted/20 p-4">
          <div className="flex flex-col gap-1.5 max-w-sm">
            <FieldLabel>Transaction / UTR Number</FieldLabel>
            <Input {...register("transactionNumber")} placeholder="e.g. UPI123456789012" />
          </div>
        </div>
      )}

      {/* Balance due summary */}
      {Number(watchedReceived) > 0 && (
        <div className="flex justify-end gap-6 rounded-lg border px-4 py-2.5 text-sm">
          <div className="flex gap-2">
            <span className="text-muted-foreground">Received</span>
            <span>₹ {Number(watchedReceived).toFixed(2)}</span>
          </div>
          <div className="flex gap-2 font-semibold">
            <span>Balance Due</span>
            <span>₹ {balanceDue.toFixed(2)}</span>
          </div>
        </div>
      )}

      <Button type="submit" disabled={isSubmitting} className="self-end">
        {submitLabel}
      </Button>
    </div>
  )
}
