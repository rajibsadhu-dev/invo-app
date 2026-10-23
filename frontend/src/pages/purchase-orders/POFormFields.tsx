import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form"
import { PlusIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { InvoCombobox } from "@/components/form"
import { formatINR, round2 } from "@/lib/money"
import { GST_RATES, type POFormValues } from "./poForm.schema"
import { POProductPickerCell } from "./POProductPickerCell"
import type { Supplier } from "@/types"

const UNIT_OPTIONS = ["pcs", "nos", "kg", "ton", "ltr", "m", "sqft", "rft", "box", "set", "hr"]

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

function computePOTotals(items: Array<{ quantity?: number | string; rate?: number | string; gstRate?: number | string }>) {
  let subtotal = 0
  let taxTotal = 0

  items.forEach((item) => {
    const qty = Number(item?.quantity) || 0
    const rate = Number(item?.rate) || 0
    const amount = round2(qty * rate)
    const gstRate = Number(item?.gstRate) || 0
    const gstAmount = round2((amount * gstRate) / 100)
    subtotal = round2(subtotal + amount)
    taxTotal = round2(taxTotal + gstAmount)
  })

  return { subtotal, taxTotal, grandTotal: round2(subtotal + taxTotal) }
}

type Props = {
  form: UseFormReturn<POFormValues>
  orgId: number
  suppliers: Supplier[]
  isSubmitting: boolean
  submitLabel: string
}

export function POFormFields({ form, orgId, suppliers, isSubmitting, submitLabel }: Props) {
  const {
    control,
    register,
    formState: { errors },
  } = form

  const { fields, append, remove } = useFieldArray({ control, name: "items" })

  const watchedItems = useWatch({ control, name: "items" }) ?? []

  const supplierOptions = suppliers.map((s) => ({
    value: String(s.id),
    label: s.name,
  }))

  const totals = computePOTotals(watchedItems)

  return (
    <div className="flex flex-col gap-6">
      {/* Supplier + Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>
            Supplier <span className="text-destructive">*</span>
          </Label>
          <InvoCombobox
            control={control}
            name="supplierId"
            options={supplierOptions}
            placeholder="Select supplier"
            searchPlaceholder="Search suppliers…"
            emptyText="No suppliers found"
          />
          {errors.supplierId && (
            <p className="text-xs text-destructive">{errors.supplierId.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>
            PO Date <span className="text-destructive">*</span>
          </Label>
          <Input type="date" {...register("poDate")} />
          {errors.poDate && <p className="text-xs text-destructive">{errors.poDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Expected Delivery</Label>
          <Input type="date" {...register("expectedDate")} />
        </div>
      </div>

      {/* Line Items */}
      <SectionHeading>Items</SectionHeading>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pl-3 text-left w-[30%]">Description</th>
              <th className="py-2 px-2 text-left w-16">HSN</th>
              <th className="py-2 px-2 text-left w-20">Unit</th>
              <th className="py-2 px-2 text-right w-16">Qty</th>
              <th className="py-2 px-2 text-right w-24">Rate</th>
              <th className="py-2 px-2 text-right w-20">GST %</th>
              <th className="py-2 px-2 text-right w-24">Amount</th>
              <th className="py-2 pr-3 w-8" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, idx) => {
              const qty = Number(watchedItems[idx]?.quantity) || 0
              const rate = Number(watchedItems[idx]?.rate) || 0
              const amount = round2(qty * rate)
              const gstRate = Number(watchedItems[idx]?.gstRate) || 0
              const gstAmount = round2((amount * gstRate) / 100)
              const lineTotal = round2(amount + gstAmount)

              return (
                <tr key={field.id} className="border-b last:border-0">
                  <td className="py-1 pl-1">
                    <POProductPickerCell form={form} orgId={orgId} index={idx} />
                    {errors.items?.[idx]?.description && (
                      <p className="px-2 text-[10px] text-destructive">
                        {errors.items[idx].description?.message}
                      </p>
                    )}
                  </td>
                  <td className="py-1 px-1">
                    <Input
                      {...register(`items.${idx}.hsnCode`)}
                      className="h-8 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0 text-xs"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <select
                      {...register(`items.${idx}.unit`)}
                      className="h-8 w-full rounded border-0 bg-transparent px-1 text-xs focus:ring-0"
                    >
                      <option value="">—</option>
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 px-1">
                    <Input
                      type="number"
                      step="any"
                      {...register(`items.${idx}.quantity`)}
                      className="h-8 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0 text-right"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <Input
                      type="number"
                      step="any"
                      {...register(`items.${idx}.rate`)}
                      className="h-8 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0 text-right"
                    />
                  </td>
                  <td className="py-1 px-1">
                    <select
                      {...register(`items.${idx}.gstRate`)}
                      className="h-8 w-full rounded border-0 bg-transparent px-1 text-xs text-right focus:ring-0"
                    >
                      {GST_RATES.map((r) => (
                        <option key={r} value={r}>
                          {r}%
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1 px-2 text-right tabular-nums">
                    <span className="text-xs">{formatINR(lineTotal)}</span>
                  </td>
                  <td className="py-1 pr-2">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={() =>
          append({
            productId: null,
            productVariantId: null,
            description: "",
            hsnCode: "",
            unit: "",
            quantity: 1,
            rate: 0,
            gstRate: 18,
          })
        }
      >
        <PlusIcon className="h-4 w-4" /> Add Item
      </Button>

      {/* Totals */}
      <div className="ml-auto w-72 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatINR(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">GST</span>
          <span className="font-medium">{formatINR(totals.taxTotal)}</span>
        </div>
        <div className="flex justify-between border-t pt-1 text-base font-semibold">
          <span>Grand Total</span>
          <span>{formatINR(totals.grandTotal)}</span>
        </div>
      </div>

      {/* Notes */}
      <SectionHeading>Notes</SectionHeading>
      <div className="space-y-1.5">
        <Label>Notes / Instructions</Label>
        <Textarea rows={3} {...register("notes")} placeholder="Any notes for this PO…" />
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <span className="mr-2 h-4 w-4 animate-spin" />} {submitLabel}
        </Button>
      </div>
    </div>
  )
}
