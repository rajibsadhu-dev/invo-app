import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Pencil, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGetProductByIdQuery } from "@/features/product/productApi"
import { useGetCategoriesQuery } from "@/features/category/categoryApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import { formatINR } from "@/lib/money"
import { ProductFormDialog } from "./ProductFormDialog"
import { VariantSection } from "./VariantSection"

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm">{value ?? "—"}</span>
    </div>
  )
}

export default function ProductDetailPage() {
  const { orgId, productId } = useParams<{ orgId: string; productId: string }>()
  const navigate = useNavigate()
  const id = Number(orgId)
  const pid = Number(productId)

  const [editOpen, setEditOpen] = useState(false)

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  const { data, isLoading, isError } = useGetProductByIdQuery({ orgId: id, productId: pid })
  const product = data?.data

  const { data: categoryData } = useGetCategoriesQuery({ orgId: id })
  const categories = categoryData?.data ?? []

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Products", to: `/org/${id}/products` },
    { label: product?.name ?? "Product" },
  ])

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading product…</p>
  }
  if (isError || !product) {
    return <p className="py-10 text-center text-sm text-destructive">Failed to load product</p>
  }

  const usageCount = product._count?.invoiceItems ?? 0
  const margin =
    product.purchasePrice === null || product.purchasePrice === undefined
      ? null
      : Number(product.sellingPrice) - Number(product.purchasePrice)

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-xl font-semibold">{product.name}</h1>
              {product.isActive ? (
                <Badge variant="outline">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {product.sku ? `SKU ${product.sku}` : "No SKU"}
              {product.category ? ` · ${product.category.name}` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/org/${id}/products`)}>
            <ArrowLeft /> Back
          </Button>
          <Button size="sm" onClick={() => setEditOpen(true)}>
            <Pencil /> Edit
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          <Field label="Selling Price" value={formatINR(Number(product.sellingPrice))} />
          <Field
            label="Purchase Price"
            value={
              product.purchasePrice === null || product.purchasePrice === undefined
                ? "—"
                : formatINR(Number(product.purchasePrice))
            }
          />
          <Field
            label="Margin"
            value={margin === null ? "—" : formatINR(margin)}
          />
          <Field label="GST Rate" value={`${Number(product.gstRate)}%`} />
          <Field label="HSN/SAC" value={product.hsnCode} />
          <Field label="Unit" value={product.unit} />
          <Field label="Category" value={product.category?.name} />
          <Field label="Has Variants" value={product.hasVariants ? "Yes" : "No"} />
          <Field
            label="On Invoices"
            value={`${usageCount} line${usageCount === 1 ? "" : "s"}`}
          />
        </div>
        {product.description && (
          <div className="mt-5 border-t pt-4">
            <Field label="Description" value={product.description} />
          </div>
        )}
      </div>

      <VariantSection orgId={id} product={product} />

      {usageCount > 0 && (
        <p className="text-xs text-muted-foreground">
          This product appears on {usageCount} invoice line{usageCount === 1 ? "" : "s"}.
          Deleting it will deactivate it instead, so those invoices keep their history.
        </p>
      )}

      {editOpen && (
        <ProductFormDialog
          orgId={id}
          categories={categories}
          product={product}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  )
}
