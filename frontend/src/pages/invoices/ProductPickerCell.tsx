import { useEffect, useRef, useState } from "react"
import type { UseFormReturn } from "react-hook-form"
import { Loader2, Package, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useSearchProductsQuery } from "@/features/product/productApi"
import { formatINR } from "@/lib/money"
import type { ProductPickerHit, ProductVariantPickerHit } from "@/types"
import type { InvoiceFormValues } from "./invoiceForm.schema"

const DEBOUNCE_MS = 250

/**
 * The description cell of an invoice line, with catalogue lookup attached.
 *
 * Typing searches products by name and SKU; picking one fills in description, HSN, unit,
 * rate and GST rate, and records `productId` so the line can be traced back to the
 * catalogue. Nothing is forced: the field stays free text, and a line typed by hand keeps
 * `productId` null. Any auto-filled value can be overwritten afterwards.
 *
 * When a product with variants is selected, a variant dropdown appears below the input.
 * Picking a variant records `productVariantId` and fills in the variant-specific price
 * if one is set.
 */
export function ProductPickerCell({
  form,
  orgId,
  index,
}: {
  form: UseFormReturn<InvoiceFormValues>
  orgId: number
  index: number
}) {
  const { register, setValue, getValues, watch } = form
  const [term, setTerm] = useState("")
  const [open, setOpen] = useState(false)
  const [pendingProduct, setPendingProduct] = useState<ProductPickerHit | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const productId = watch(`items.${index}.productId`)
  const productVariantId = watch(`items.${index}.productVariantId`)

  const descriptionField = register(`items.${index}.description`)

  const { data, isFetching } = useSearchProductsQuery(
    { orgId, q: term },
    { skip: term.trim().length < 2 }
  )
  const hits = data?.data ?? []

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setPendingProduct(null)
      }
    }
    document.addEventListener("mousedown", onPointerDown)
    return () => document.removeEventListener("mousedown", onPointerDown)
  }, [open])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  const queueSearch = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setTerm(value), DEBOUNCE_MS)
  }

  const applyProduct = (product: ProductPickerHit) => {
    setValue(`items.${index}.productId`, product.id, { shouldDirty: true })
    setValue(`items.${index}.productVariantId`, null, { shouldDirty: true })
    setValue(`items.${index}.description`, product.name, { shouldDirty: true })
    setValue(`items.${index}.hsnCode`, product.hsnCode ?? "", { shouldDirty: true })
    setValue(`items.${index}.unit`, product.unit ?? "", { shouldDirty: true })
    setValue(`items.${index}.rate`, Number(product.sellingPrice), { shouldDirty: true })
    setValue(`items.${index}.gstRate`, Number(product.gstRate), { shouldDirty: true })
    setTerm("")

    if (product.hasVariants && product.variants && product.variants.length > 0) {
      setPendingProduct(product)
      setOpen(false)
    } else {
      setPendingProduct(null)
      setOpen(false)
    }
  }

  const applyVariant = (variant: ProductVariantPickerHit) => {
    setValue(`items.${index}.productVariantId`, variant.id, { shouldDirty: true })
    if (variant.sellingPrice !== null && variant.sellingPrice !== undefined) {
      setValue(`items.${index}.rate`, Number(variant.sellingPrice), { shouldDirty: true })
    }
    const desc = getValues(`items.${index}.description`)
    setValue(`items.${index}.description`, `${desc} (${variant.name})`, { shouldDirty: true })
    setPendingProduct(null)
  }

  const showVariantPicker = pendingProduct && pendingProduct.variants && pendingProduct.variants.length > 0

  return (
    <div ref={containerRef} className="relative">
      <Input
        {...descriptionField}
        onChange={(e) => {
          descriptionField.onChange(e)
          if (getValues(`items.${index}.productId`)) {
            setValue(`items.${index}.productId`, null, { shouldDirty: true })
            setValue(`items.${index}.productVariantId`, null, { shouldDirty: true })
            setPendingProduct(null)
          }
          queueSearch(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search the catalogue or type an item"
        autoComplete="off"
        className="h-8 border-0 bg-transparent px-2 shadow-none focus-visible:ring-0"
      />

      {/* Product search dropdown */}
      {open && term.trim().length >= 2 && (
        <div className="absolute left-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-lg border bg-popover shadow-md">
          {isFetching && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…
            </div>
          )}
          {!isFetching && hits.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
              <Package className="h-3.5 w-3.5" /> No products match — this line stays as
              typed
            </div>
          )}
          {hits.map((product) => (
            <button
              key={product.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                applyProduct(product)
              }}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {product.name}
                  {product.hasVariants && product.variants && product.variants.length > 0 && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({product.variants.length} variant{product.variants.length === 1 ? "" : "s"})
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {product.sku ? `${product.sku} · ` : ""}
                  {product.hsnCode ? `HSN ${product.hsnCode} · ` : ""}
                  {Number(product.gstRate)}% GST
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-xs font-medium">
                  {formatINR(Number(product.sellingPrice))}
                  {product.unit ? ` / ${product.unit}` : ""}
                </span>
                {!product.hasVariants && (
                  <span className={`block text-[10px] ${Number(product.stockQuantity) <= 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {Number(product.stockQuantity)} in stock
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Variant picker dropdown — shown after selecting a product with variants */}
      {showVariantPicker && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg border bg-popover shadow-md">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b flex items-center gap-1.5">
            <ChevronDown className="h-3 w-3" /> Select a variant
          </div>
          {pendingProduct!.variants!.map((variant) => (
            <button
              key={variant.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                applyVariant(variant)
              }}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{variant.name}</span>
                {variant.sku && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {variant.sku}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right">
                {variant.sellingPrice !== null && variant.sellingPrice !== undefined && (
                  <span className="block text-xs font-medium">
                    {formatINR(Number(variant.sellingPrice))}
                  </span>
                )}
                <span className={`block text-[10px] ${Number(variant.stockQuantity) <= 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {Number(variant.stockQuantity)} in stock
                </span>
              </span>
            </button>
          ))}
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              setPendingProduct(null)
            }}
            className="flex w-full items-center px-3 py-2 text-xs text-muted-foreground hover:bg-accent"
          >
            Skip — use base product
          </button>
        </div>
      )}

      {/* Variant badge indicator */}
      {productId && productVariantId && !showVariantPicker && (
        <span className="text-[10px] text-muted-foreground px-2">variant selected</span>
      )}
    </div>
  )
}
