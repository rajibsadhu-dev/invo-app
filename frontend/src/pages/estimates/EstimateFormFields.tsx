import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form"
import { PlusIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { InvoCombobox } from "@/components/form"
import { amountInWords, computeInvoiceTotals, formatINR } from "@/lib/money"
import {
  GST_RATES,
  UNIT_OPTIONS,
  getDefaultGstRate,
  getDefaultUnit,
  saveDefaultGstRate,
  saveDefaultUnit,
  type EstimateFormValues,
} from "./estimateForm.schema"
import type { Customer } from "@/types"
import type { InvoiceFieldConfig } from "@/lib/invoiceFieldConfig"
import { ProductPickerCell } from "../invoices/ProductPickerCell"

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

type Props = {
  form: UseFormReturn<EstimateFormValues>
  orgId: number
  customers: Customer[]
  orgStateCode?: string | null
  fieldConfig?: InvoiceFieldConfig
  isSubmitting: boolean
  submitLabel: string
}

export function EstimateFormFields({
  form,
  orgId,
  customers,
  orgStateCode,
  fieldConfig,
  isSubmitting,
  submitLabel,
}: Props) {
  const fc = fieldConfig ?? { challanNo: true, vehicleNo: true, siteLocation: true, billingAddress: true }
  const { control, register, formState: { errors } } = form

  const { fields, append, remove } = useFieldArray({ control, name: "items" })

  const watchedItems = useWatch({ control, name: "items" }) ?? []
  const watchedDiscount = useWatch({ control, name: "discount" }) ?? 0
  const watchedCustomerId = useWatch({ control, name: "customerId" })

  const customerOptions = customers.map((c) => ({
    value: String(c.id),
    label: c.name,
  }))

  const selectedCustomer = customers.find((c) => c.id === Number(watchedCustomerId))
  const customerStateCode = selectedCustomer?.stateCode ?? null
  const isIntraState =
    !orgStateCode || !customerStateCode || orgStateCode === customerStateCode

  const hasGst = watchedItems.some((item) => Number(item?.gstRate) > 0)
  const missingStateCode = hasGst && (!orgStateCode || !customerStateCode)

  const totals = computeInvoiceTotals(watchedItems, {
    discount: Number(watchedDiscount) || 0,
    isIntraState,
  })

  return (
    <div className="flex flex-col gap-6">

      {/* ── Customer + Dates ── */}
      <div className="grid grid-cols-3 gap-4">
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
          <FieldLabel required>Estimate Date</FieldLabel>
          <Input type="date" {...register("estimateDate")} />
          {errors.estimateDate && (
            <p className="text-xs text-destructive">{errors.estimateDate.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Valid Until</FieldLabel>
          <Input type="date" {...register("validUntil")} />
        </div>
      </div>

      {/* ── Line Items ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <FieldLabel>Items</FieldLabel>
            <span className="text-xs text-muted-foreground">
              Type in Description to search the catalogue, or write the item out by hand.
            </span>
          </div>
          <Button
            type="button" size="sm" variant="outline"
            onClick={() =>
              append({
                productId: null,
                productVariantId: null,
                description: "",
                hsnCode: "",
                unit: getDefaultUnit(),
                quantity: 1,
                rate: 0,
                gstRate: getDefaultGstRate(),
              })
            }
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
                <th className="w-24 px-3 py-2 text-left font-medium text-muted-foreground">HSN/SAC</th>
                <th className="w-20 px-3 py-2 text-left font-medium text-muted-foreground">Unit</th>
                <th className="w-20 px-3 py-2 text-left font-medium text-muted-foreground">Qty</th>
                <th className="w-28 px-3 py-2 text-left font-medium text-muted-foreground">Rate (₹)</th>
                <th className="w-20 px-3 py-2 text-left font-medium text-muted-foreground">GST %</th>
                <th className="w-28 px-3 py-2 text-right font-medium text-muted-foreground">Amount (₹)</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {fields.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-4 text-center text-xs text-muted-foreground">
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
                      <ProductPickerCell form={form as unknown as UseFormReturn<InvoiceFormValues>} orgId={orgId} index={index} />
                      {errors.items?.[index]?.description && (
                        <p className="text-xs text-destructive">{errors.items[index]!.description!.message}</p>
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      <Input
                        {...register(`items.${index}.hsnCode`)}
                        placeholder="e.g. 7308"
                        inputMode="numeric"
                        className="h-8 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
                      />
                      {errors.items?.[index]?.hsnCode && (
                        <p className="text-xs text-destructive">{errors.items[index]!.hsnCode!.message}</p>
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
                    <td className="px-3 py-1.5">
                      {(() => {
                        const gstReg = register(`items.${index}.gstRate`)
                        return (
                          <select
                            {...gstReg}
                            onChange={(e) => {
                              gstReg.onChange(e)
                              saveDefaultGstRate(Number(e.target.value))
                            }}
                            className="h-8 w-full cursor-pointer border-0 bg-white px-2 text-sm text-black outline-none focus:ring-0"
                          >
                            {GST_RATES.map((r) => (
                              <option key={r} value={r}>
                                {r}%
                              </option>
                            ))}
                          </select>
                        )
                      })()}
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium">
                      {formatINR(qty * rate)}
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

      {/* ── Discount ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Discount (₹)</FieldLabel>
          <Input {...register("discount")} type="number" min="0" step="any" placeholder="0.00" />
          <p className="text-xs text-muted-foreground">
            Applied across all lines pro rata, before GST.
          </p>
        </div>
      </div>

      {missingStateCode && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          A GST state code is missing on{" "}
          {!orgStateCode ? "this organization" : "the selected customer"}. Set it before
          saving — GST cannot be split into CGST/SGST or IGST without it.
        </p>
      )}

      {/* ── Totals Summary ── */}
      <div className="rounded-lg border bg-muted/20 p-4">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatINR(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>− {formatINR(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxable Value</span>
            <span>{formatINR(totals.taxableValue)}</span>
          </div>
          {isIntraState ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CGST</span>
                <span>+ {formatINR(totals.cgstTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SGST</span>
                <span>+ {formatINR(totals.sgstTotal)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span className="text-muted-foreground">IGST</span>
              <span>+ {formatINR(totals.igstTotal)}</span>
            </div>
          )}
          {totals.roundOff !== 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Round Off</span>
              <span>
                {totals.roundOff < 0 ? "− " : "+ "}
                {formatINR(Math.abs(totals.roundOff))}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t pt-1.5 text-base font-semibold">
            <span>Grand Total</span>
            <span>{formatINR(totals.grandTotal)}</span>
          </div>
        </div>
        {totals.grandTotal > 0 && (
          <p className="mt-2 text-xs italic text-muted-foreground">
            {amountInWords(totals.grandTotal)}
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          {isIntraState
            ? "Intra-state supply — GST split as CGST + SGST."
            : "Inter-state supply — GST charged as IGST."}
        </p>
      </div>

      {/* ── Additional Details ── */}
      {(fc.challanNo || fc.vehicleNo || fc.siteLocation || fc.billingAddress) && (
        <SectionHeading>Additional Details</SectionHeading>
      )}

      {(fc.challanNo || fc.vehicleNo || fc.siteLocation) && (
        <div className="grid grid-cols-3 gap-4">
          {fc.challanNo && (
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Challan No.</FieldLabel>
              <Input {...register("challanNo")} placeholder="e.g. CH-001" />
            </div>
          )}
          {fc.vehicleNo && (
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Vehicle No.</FieldLabel>
              <Input {...register("vehicleNo")} placeholder="e.g. WB 01 AB 1234" />
            </div>
          )}
          {fc.siteLocation && (
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Site / Delivery Location</FieldLabel>
              <Input {...register("siteLocation")} placeholder="Delivery site or location" />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {fc.billingAddress && (
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Billing Address</FieldLabel>
            <Input {...register("billingAddress")} placeholder="If different from customer address" />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>PO / Reference No.</FieldLabel>
          <Input {...register("referenceNumber")} placeholder="e.g. PO-2024-001" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Terms & Conditions</FieldLabel>
        <Textarea
          {...register("termsAndConditions")}
          placeholder="e.g. This estimate is valid for 30 days."
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

      <Button
        type="submit"
        disabled={isSubmitting || missingStateCode}
        className="self-end"
      >
        {submitLabel}
      </Button>
    </div>
  )
}
