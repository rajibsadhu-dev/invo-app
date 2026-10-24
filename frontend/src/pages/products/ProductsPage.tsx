import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  PlusIcon,
  Pencil,
  Trash2,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  FolderTree,
  SlidersHorizontal,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  useGetProductsQuery,
  useDeleteProductMutation,
} from "@/features/product/productApi"
import { useGetCategoriesQuery } from "@/features/category/categoryApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import { formatINR } from "@/lib/money"
import { getApiErrorMessage } from "@/lib/apiError"
import type { Product } from "@/types"
import { ProductFormDialog } from "./ProductFormDialog"

const ALL = "all"

export default function ProductsPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const id = Number(orgId)

  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [categoryId, setCategoryId] = useState<string>(ALL)
  const [activeFilter, setActiveFilter] = useState<string>(ALL)
  const [page, setPage] = useState(1)
  const limit = 10

  const [addOpen, setAddOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Products" },
  ])

  const { data: categoryData } = useGetCategoriesQuery({ orgId: id })
  const categories = categoryData?.data ?? []

  const { data, isLoading, isError } = useGetProductsQuery({
    orgId: id,
    search: search || undefined,
    categoryId: categoryId === ALL ? undefined : Number(categoryId),
    isActive: activeFilter === ALL ? undefined : activeFilter === "active",
    page,
    limit,
  })

  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation()

  const products = data?.data ?? []
  const meta = data?.meta

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleDelete = async (productId: number) => {
    try {
      // The server decides: an invoiced product is deactivated, an unused one removed.
      const res = await deleteProduct({ orgId: id, productId }).unwrap()
      toast.success(res.message || "Product deleted")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete product"))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">
            {org?.name ?? "Organization"} · {meta?.total ?? 0} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/org/${id}/products/attributes`)}
          >
            <SlidersHorizontal /> Attributes
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/org/${id}/products/categories`)}
          >
            <FolderTree /> Categories
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <PlusIcon /> Add Product
          </Button>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value)
            setPage(1)
          }}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value={ALL}>All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => {
            setActiveFilter(e.target.value)
            setPage(1)
          }}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value={ALL}>Active & inactive</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
        {(search || categoryId !== ALL || activeFilter !== ALL) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("")
              setSearchInput("")
              setCategoryId(ALL)
              setActiveFilter(ALL)
              setPage(1)
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>HSN/SAC</TableHead>
              <TableHead className="text-right">Price (₹)</TableHead>
              <TableHead className="text-right">Margin</TableHead>
              <TableHead className="text-right">GST</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  Loading products…
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-destructive">
                  Failed to load products
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && products.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {search || categoryId !== ALL || activeFilter !== ALL
                        ? "No products match your filters"
                        : "No products yet"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => (
              <TableRow
                key={product.id}
                className="cursor-pointer"
                onClick={() => navigate(`/org/${id}/products/${product.id}`)}
              >
                <TableCell className="font-medium">
                  {product.name}
                  {product.unit && (
                    <span className="ml-1 text-xs text-muted-foreground">/ {product.unit}</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{product.sku ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {product.category?.name ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{product.hsnCode ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {formatINR(Number(product.sellingPrice))}
                </TableCell>
                <TableCell className="text-right">
                  {product.purchasePrice != null ? (
                    (() => {
                      const sell = Number(product.sellingPrice)
                      const buy = Number(product.purchasePrice)
                      const margin = sell > 0 ? ((sell - buy) / sell) * 100 : 0
                      return (
                        <span className={margin < 0 ? "text-destructive" : margin < 10 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"}>
                          {margin.toFixed(1)}%
                        </span>
                      )
                    })()
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {Number(product.gstRate)}%
                </TableCell>
                <TableCell>
                  {product.isActive ? (
                    <Badge variant="outline">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditProduct(product)}>
                      <Pencil />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <Trash2 className="text-destructive" />
                        <span className="sr-only">Delete</span>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete product?</AlertDialogTitle>
                          <AlertDialogDescription>
                            <strong>{product.name}</strong> will be deleted. If it already
                            appears on an invoice it is deactivated instead, so the invoice
                            keeps its history.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={() => handleDelete(product.id)}
                          >
                            {isDeleting && <Loader2 className="animate-spin" />} Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} products
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ProductFormDialog
        orgId={id}
        categories={categories}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
      {editProduct && (
        <ProductFormDialog
          orgId={id}
          categories={categories}
          product={editProduct}
          open={!!editProduct}
          onOpenChange={(v) => {
            if (!v) setEditProduct(null)
          }}
        />
      )}
    </div>
  )
}
