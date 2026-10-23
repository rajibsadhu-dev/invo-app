import { useState } from "react"
import { useForm, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { ArrowDown, ArrowUp, Clock, PackagePlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useAdjustStockMutation,
  useGetProductMovementsQuery,
} from "@/features/inventory/inventoryApi"
import { getApiErrorMessage } from "@/lib/apiError"
import type { Product, ProductVariant } from "@/types"

const adjustSchema = z.object({
  quantity: z.coerce.number().refine((v) => v !== 0, "Quantity cannot be zero"),
  type: z.enum(["adjustment", "return", "opening", "purchase"]),
  notes: z.string().max(500).optional(),
  variantId: z.coerce.number().optional(),
})

type AdjustValues = z.infer<typeof adjustSchema>

function MovementTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    sale: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    purchase: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    adjustment: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    return: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    opening: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${colors[type] ?? ""}`}>
      {type}
    </span>
  )
}

export function StockSection({
  orgId,
  product,
}: {
  orgId: number
  product: Product
}) {
  const [adjustOpen, setAdjustOpen] = useState(false)

  const { data: movementData, isLoading: movementsLoading } = useGetProductMovementsQuery({
    orgId,
    productId: product.id,
    limit: 10,
  })
  const movements = movementData?.data ?? []

  const [adjustStock, { isLoading: adjusting }] = useAdjustStockMutation()

  const form = useForm<AdjustValues>({
    resolver: zodResolver(adjustSchema) as Resolver<AdjustValues>,
    defaultValues: { quantity: 0, type: "adjustment", notes: "" },
  })

  const variants = product.variants ?? []

  const handleAdjust = async (values: AdjustValues) => {
    try {
      await adjustStock({
        orgId,
        productId: product.id,
        body: {
          quantity: values.quantity,
          type: values.type,
          notes: values.notes || undefined,
          variantId: values.variantId || undefined,
        },
      }).unwrap()
      toast.success("Stock adjusted")
      setAdjustOpen(false)
      form.reset()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to adjust stock"))
    }
  }

  const stockQty = Number(product.stockQuantity)
  const lowAlert = product.lowStockAlert ? Number(product.lowStockAlert) : null
  const isLow = lowAlert !== null && stockQty <= lowAlert

  return (
    <div className="space-y-4">
      {/* Stock overview */}
      {!product.hasVariants && (
        <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-sm font-semibold">Stock</h3>
            <Button variant="outline" size="sm" onClick={() => setAdjustOpen(true)}>
              <PackagePlus className="mr-1 h-3.5 w-3.5" /> Adjust
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Stock</p>
              <p className={`text-lg font-semibold ${isLow ? "text-destructive" : ""}`}>
                {stockQty} {product.unit ?? ""}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Low Alert</p>
              <p className="text-sm">{lowAlert !== null ? `${lowAlert} ${product.unit ?? ""}` : "Not set"}</p>
            </div>
            {isLow && (
              <div className="flex items-center">
                <Badge variant="destructive">Low Stock</Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Variant stock overview */}
      {product.hasVariants && variants.length > 0 && (
        <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading text-sm font-semibold">Variant Stock</h3>
            <Button variant="outline" size="sm" onClick={() => setAdjustOpen(true)}>
              <PackagePlus className="mr-1 h-3.5 w-3.5" /> Adjust
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-4">Variant</th>
                  <th className="py-2 pr-4 text-right">Stock</th>
                  <th className="py-2 pr-4 text-right">Alert</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {variants.filter((v: ProductVariant) => v.isActive).map((v: ProductVariant) => {
                  const vQty = Number(v.stockQuantity)
                  const vAlert = v.lowStockAlert ? Number(v.lowStockAlert) : null
                  const vLow = vAlert !== null && vQty <= vAlert
                  return (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{v.name}</td>
                      <td className={`py-2 pr-4 text-right ${vLow ? "text-destructive font-medium" : ""}`}>
                        {vQty}
                      </td>
                      <td className="py-2 pr-4 text-right text-muted-foreground">
                        {vAlert ?? "—"}
                      </td>
                      <td className="py-2">
                        {vLow && <Badge variant="destructive" className="text-[10px]">Low</Badge>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent movements */}
      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-heading text-sm font-semibold">Recent Stock Movements</h3>
        </div>
        {movementsLoading && (
          <p className="text-xs text-muted-foreground py-3">Loading…</p>
        )}
        {!movementsLoading && movements.length === 0 && (
          <p className="text-xs text-muted-foreground py-3">No stock movements yet</p>
        )}
        {movements.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Qty</th>
                  <th className="py-2 pr-3">Variant</th>
                  <th className="py-2 pr-3">By</th>
                  <th className="py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const qty = Number(m.quantity)
                  return (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-3">
                        <MovementTypeBadge type={m.type} />
                      </td>
                      <td className={`py-2 pr-3 font-medium whitespace-nowrap ${qty > 0 ? "text-green-600" : "text-red-600"}`}>
                        <span className="inline-flex items-center gap-0.5">
                          {qty > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {Math.abs(qty)}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {m.variant?.name ?? "—"}
                      </td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {m.user.name}
                      </td>
                      <td className="py-2 text-xs text-muted-foreground truncate max-w-[200px]">
                        {m.notes ?? "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock — {product.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleAdjust)} className="space-y-4">
            {product.hasVariants && variants.length > 0 && (
              <div className="space-y-1.5">
                <Label>Variant</Label>
                <Select
                  onValueChange={(v) => form.setValue("variantId", Number(v))}
                >
                  <SelectTrigger><SelectValue placeholder="Select variant" /></SelectTrigger>
                  <SelectContent>
                    {variants.filter((v: ProductVariant) => v.isActive).map((v: ProductVariant) => (
                      <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.variantId && (
                  <p className="text-xs text-destructive">{form.formState.errors.variantId.message}</p>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Quantity (positive = add, negative = remove)</Label>
              <Input type="number" step="any" {...form.register("quantity", { valueAsNumber: true })} />
              {form.formState.errors.quantity && (
                <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                defaultValue="adjustment"
                onValueChange={(v) => form.setValue("type", v as AdjustValues["type"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="opening">Opening Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea rows={2} {...form.register("notes")} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={adjusting}>
                {adjusting ? "Saving…" : "Adjust Stock"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
