import { useState } from "react"
import { Loader2, Plus, Shuffle, Trash2, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  useGetVariantsQuery,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
  useBulkGenerateVariantsMutation,
} from "@/features/product/variantApi"
import {
  useGetVariantAttributesQuery,
} from "@/features/variant-attribute/variantAttributeApi"
import { getApiErrorMessage } from "@/lib/apiError"
import { formatINR } from "@/lib/money"
import type { Product, ProductVariant, VariantAttribute } from "@/types"

export function VariantSection({
  orgId,
  product,
}: {
  orgId: number
  product: Product
}) {
  const { data: variantsData, isLoading } = useGetVariantsQuery({
    orgId,
    productId: product.id,
  })
  const variants = variantsData?.data ?? []
  const { data: attrData } = useGetVariantAttributesQuery({ orgId })
  const orgAttributes = attrData?.data ?? []

  const [generateOpen, setGenerateOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [editVariant, setEditVariant] = useState<ProductVariant | null>(null)

  if (!product.hasVariants) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Variants</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setGenerateOpen(true)}>
            <Shuffle className="mr-1.5 h-3.5 w-3.5" /> Generate
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Variant
          </Button>
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground py-4 text-center">Loading variants…</p>
      )}

      {!isLoading && variants.length === 0 && (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No variants yet. Use <strong>Generate</strong> to create combinations from
          attributes, or <strong>Add Variant</strong> for a manual entry.
        </p>
      )}

      {variants.length > 0 && (
        <VariantTable
          orgId={orgId}
          product={product}
          variants={variants}
          onEdit={setEditVariant}
        />
      )}

      {generateOpen && (
        <GenerateDialog
          orgId={orgId}
          productId={product.id}
          orgAttributes={orgAttributes}
          open={generateOpen}
          onOpenChange={setGenerateOpen}
        />
      )}

      {addOpen && (
        <AddVariantDialog
          orgId={orgId}
          productId={product.id}
          orgAttributes={orgAttributes}
          open={addOpen}
          onOpenChange={setAddOpen}
        />
      )}

      {editVariant && (
        <EditVariantDialog
          orgId={orgId}
          productId={product.id}
          variant={editVariant}
          open={!!editVariant}
          onOpenChange={(v) => { if (!v) setEditVariant(null) }}
        />
      )}
    </div>
  )
}

// ─── Variant table ───────────────────────────────────────────────────────────

function VariantTable({
  orgId,
  product,
  variants,
  onEdit,
}: {
  orgId: number
  product: Product
  variants: ProductVariant[]
  onEdit: (v: ProductVariant) => void
}) {
  const [deleteVariant, { isLoading: isDeleting }] = useDeleteVariantMutation()
  const [updateVariant] = useUpdateVariantMutation()

  const handleToggleActive = async (v: ProductVariant) => {
    try {
      await updateVariant({
        orgId,
        productId: product.id,
        variantId: v.id,
        body: { isActive: !v.isActive },
      }).unwrap()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update variant"))
    }
  }

  const handleDelete = async (v: ProductVariant) => {
    try {
      const res = await deleteVariant({
        orgId,
        productId: product.id,
        variantId: v.id,
      }).unwrap()
      toast.success(res.message)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete variant"))
    }
  }

  const attrKeys = getAttributeKeys(variants)
  const parentPrice = Number(product.sellingPrice)

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {attrKeys.map((k) => (
              <TableHead key={k}>{k}</TableHead>
            ))}
            <TableHead>SKU</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-center">Active</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {variants.map((v) => {
            const attrs = v.attributes as Record<string, string>
            const price = v.sellingPrice !== null && v.sellingPrice !== undefined
              ? Number(v.sellingPrice)
              : parentPrice

            return (
              <TableRow key={v.id} className={v.isActive ? "" : "opacity-50"}>
                <TableCell className="font-medium">{v.name}</TableCell>
                {attrKeys.map((k) => (
                  <TableCell key={k}>
                    <Badge variant="outline" className="text-xs">
                      {attrs[k] ?? "—"}
                    </Badge>
                  </TableCell>
                ))}
                <TableCell className="text-xs text-muted-foreground">
                  {v.sku ?? "—"}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {formatINR(price)}
                  {v.sellingPrice !== null && v.sellingPrice !== undefined && (
                    <span className="ml-1 text-xs text-muted-foreground">(override)</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={v.isActive}
                    onCheckedChange={() => handleToggleActive(v)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(v)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      disabled={isDeleting}
                      onClick={() => handleDelete(v)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── Generate dialog ─────────────────────────────────────────────────────────

function GenerateDialog({
  orgId,
  productId,
  orgAttributes,
  open,
  onOpenChange,
}: {
  orgId: number
  productId: number
  orgAttributes: VariantAttribute[]
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [bulkGenerate, { isLoading }] = useBulkGenerateVariantsMutation()
  const [selected, setSelected] = useState<Record<string, string[]>>({})

  const toggleValue = (attrName: string, value: string) => {
    setSelected((prev) => {
      const current = prev[attrName] ?? []
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      if (next.length === 0) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [attrName]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [attrName]: next }
    })
  }

  const comboCount = Object.values(selected).reduce(
    (n, vals) => n * vals.length,
    Object.keys(selected).length > 0 ? 1 : 0
  )

  const handleGenerate = async () => {
    if (comboCount === 0) return
    try {
      const res = await bulkGenerate({
        orgId,
        productId,
        body: { attributes: selected },
      }).unwrap()
      toast.success(res.message)
      onOpenChange(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to generate variants"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Variant Combinations</DialogTitle>
        </DialogHeader>

        {orgAttributes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No variant attributes defined for this organization. Add attributes like
            "Size" or "Color" in the product settings first.
          </p>
        ) : (
          <div className="flex flex-col gap-4 max-h-80 overflow-y-auto">
            {orgAttributes.map((attr) => (
              <div key={attr.id} className="flex flex-col gap-2">
                <Label className="text-sm font-medium">{attr.name}</Label>
                <div className="flex flex-wrap gap-2">
                  {(attr.values as string[]).map((val) => {
                    const checked = selected[attr.name]?.includes(val) ?? false
                    return (
                      <label
                        key={val}
                        className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm cursor-pointer hover:bg-accent data-[checked=true]:bg-primary/10 data-[checked=true]:border-primary"
                        data-checked={checked}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleValue(attr.name, val)}
                        />
                        {val}
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="mt-2">
          <div className="flex items-center gap-3 w-full justify-between">
            <span className="text-xs text-muted-foreground">
              {comboCount > 0 ? `${comboCount} combination${comboCount === 1 ? "" : "s"}` : "Select values"}
            </span>
            <Button
              onClick={handleGenerate}
              disabled={isLoading || comboCount === 0}
            >
              {isLoading && <Loader2 className="animate-spin mr-1.5" />}
              Generate
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Add variant dialog ──────────────────────────────────────────────────────

function AddVariantDialog({
  orgId,
  productId,
  orgAttributes,
  open,
  onOpenChange,
}: {
  orgId: number
  productId: number
  orgAttributes: VariantAttribute[]
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [createVariant, { isLoading }] = useCreateVariantMutation()
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [sellingPrice, setSellingPrice] = useState("")
  const [attrs, setAttrs] = useState<Record<string, string>>({})

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Variant name is required")
      return
    }
    try {
      await createVariant({
        orgId,
        productId,
        body: {
          name: name.trim(),
          sku: sku.trim() || null,
          attributes: attrs,
          sellingPrice: sellingPrice ? Number(sellingPrice) : null,
        },
      }).unwrap()
      toast.success("Variant created")
      onOpenChange(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create variant"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Variant</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Red / Large" />
          </div>
          <div>
            <Label className="text-xs">SKU</Label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label className="text-xs">Price Override (₹)</Label>
            <Input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="Leave blank to use product price"
            />
          </div>
          {orgAttributes.map((attr) => (
            <div key={attr.id}>
              <Label className="text-xs">{attr.name}</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={attrs[attr.name] ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  setAttrs((prev) => {
                    if (!val) {
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
                      const { [attr.name]: _, ...rest } = prev
                      return rest
                    }
                    return { ...prev, [attr.name]: val }
                  })
                }}
              >
                <option value="">—</option>
                {(attr.values as string[]).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <DialogFooter className="mt-1">
          <Button onClick={handleCreate} disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin mr-1.5" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit variant dialog ─────────────────────────────────────────────────────

function EditVariantDialog({
  orgId,
  productId,
  variant,
  open,
  onOpenChange,
}: {
  orgId: number
  productId: number
  variant: ProductVariant
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [updateVariant, { isLoading }] = useUpdateVariantMutation()
  const [name, setName] = useState(variant.name)
  const [sku, setSku] = useState(variant.sku ?? "")
  const [sellingPrice, setSellingPrice] = useState(
    variant.sellingPrice !== null && variant.sellingPrice !== undefined
      ? String(Number(variant.sellingPrice))
      : ""
  )

  const handleSave = async () => {
    try {
      await updateVariant({
        orgId,
        productId,
        variantId: variant.id,
        body: {
          name: name.trim() || undefined,
          sku: sku.trim() || null,
          sellingPrice: sellingPrice ? Number(sellingPrice) : null,
        },
      }).unwrap()
      toast.success("Variant updated")
      onOpenChange(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update variant"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Variant</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">SKU</Label>
            <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <Label className="text-xs">Price Override (₹)</Label>
            <Input
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="Leave blank to use product price"
            />
          </div>
        </div>
        <DialogFooter className="mt-1">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin mr-1.5" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAttributeKeys(variants: ProductVariant[]): string[] {
  const keys = new Set<string>()
  for (const v of variants) {
    const attrs = v.attributes as Record<string, string>
    for (const k of Object.keys(attrs)) keys.add(k)
  }
  return [...keys].sort()
}
