import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import type { Resolver } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { InvoForm, InvoInput, InvoSelect, InvoSwitch, InvoTextarea } from "@/components/form"
import {
  useCreateProductMutation,
  useUpdateProductMutation,
} from "@/features/product/productApi"
import { GST_RATES, UNIT_OPTIONS } from "@/pages/invoices/invoiceForm.schema"
import { getApiErrorMessage } from "@/lib/apiError"
import type { Product, ProductCategory } from "@/types"
import {
  productSchema,
  productDefaults,
  toProductPayload,
  NO_CATEGORY,
  type ProductFormValues,
} from "./productForm.schema"

/**
 * One dialog for both create and edit — the fields, validation and payload shaping are
 * identical, only the mutation and the defaults differ.
 */
export function ProductFormDialog({
  orgId,
  categories,
  product,
  open,
  onOpenChange,
}: {
  orgId: number
  categories: ProductCategory[]
  /** Absent for a new product. */
  product?: Product
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation()
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation()
  const isEdit = !!product

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as Resolver<ProductFormValues>,
    defaultValues: product
      ? {
          name: product.name,
          sku: product.sku ?? "",
          description: product.description ?? "",
          categoryId: product.categoryId ? String(product.categoryId) : NO_CATEGORY,
          hsnCode: product.hsnCode ?? "",
          unit: product.unit ?? "",
          sellingPrice: Number(product.sellingPrice),
          purchasePrice: product.purchasePrice === null || product.purchasePrice === undefined
            ? ""
            : Number(product.purchasePrice),
          gstRate: Number(product.gstRate),
          isActive: product.isActive,
          hasVariants: product.hasVariants,
        }
      : productDefaults,
  })

  const categoryOptions = [
    { value: NO_CATEGORY, label: "No category" },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ]

  const unitOptions = [
    { value: "", label: "—" },
    ...UNIT_OPTIONS.map((u) => ({ value: u, label: u })),
  ]

  const gstOptions = GST_RATES.map((r) => ({ value: String(r), label: `${r}%` }))

  const onSubmit = async (values: ProductFormValues) => {
    const body = toProductPayload(values)
    try {
      if (product) {
        await updateProduct({ orgId, productId: product.id, body }).unwrap()
        toast.success("Product updated successfully")
      } else {
        await createProduct({ orgId, body }).unwrap()
        toast.success("Product created successfully")
        form.reset(productDefaults)
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, `Failed to ${isEdit ? "update" : "create"} product`)
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput control={form.control} name="name" label="Name" required />
          <div className="grid grid-cols-2 gap-4">
            <InvoInput
              control={form.control}
              name="sku"
              label="SKU"
              description="Unique within this organization"
            />
            <InvoSelect
              control={form.control}
              name="categoryId"
              label="Category"
              options={categoryOptions}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <InvoInput
              control={form.control}
              name="hsnCode"
              label="HSN/SAC"
              placeholder="e.g. 2523"
            />
            <InvoSelect control={form.control} name="unit" label="Unit" options={unitOptions} />
            <InvoSelect control={form.control} name="gstRate" label="GST Rate" options={gstOptions} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InvoInput
              control={form.control}
              name="sellingPrice"
              label="Selling Price (₹)"
              type="number"
              required
              description="GST-exclusive"
            />
            <InvoInput
              control={form.control}
              name="purchasePrice"
              label="Purchase Price (₹)"
              type="number"
              description="Optional — for margin tracking"
            />
          </div>
          <InvoTextarea control={form.control} name="description" label="Description" rows={2} />
          <InvoSwitch
            control={form.control}
            name="isActive"
            label="Active"
            description="Inactive products stay on past invoices but drop out of the picker"
          />
          <InvoSwitch
            control={form.control}
            name="hasVariants"
            label="This product has variants"
            description="Enable to manage sizes, colours and other variants"
          />
          <DialogFooter className="mt-1">
            <Button type="submit" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Add Product"}
            </Button>
          </DialogFooter>
        </InvoForm>
      </DialogContent>
    </Dialog>
  )
}
