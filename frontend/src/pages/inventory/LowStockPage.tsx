import { useParams, Link } from "react-router-dom"
import { AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useGetLowStockQuery } from "@/features/inventory/inventoryApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"

export default function LowStockPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const id = Number(orgId)

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Inventory", to: `/org/${id}/inventory` },
    { label: "Low Stock" },
  ])

  const { data, isLoading } = useGetLowStockQuery(id)
  const result = data?.data

  const allItems = [
    ...(result?.products ?? []).map((p) => ({
      ...p,
      linkTo: `/org/${id}/products/${p.id}`,
    })),
    ...(result?.variants ?? []).map((v) => ({
      ...v,
      linkTo: `/org/${id}/products/${v.productId}`,
    })),
  ]

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <h1 className="font-heading text-xl font-semibold">Low Stock</h1>
        {result && (
          <Badge variant="destructive">{result.totalCount}</Badge>
        )}
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      )}

      {!isLoading && allItems.length === 0 && (
        <div className="rounded-xl bg-card p-8 text-center ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">All products are above their stock thresholds.</p>
        </div>
      )}

      {allItems.length > 0 && (
        <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Alert At</th>
              </tr>
            </thead>
            <tbody>
              {allItems.map((item, i) => (
                <tr key={`${item.type}-${item.id}`} className={i < allItems.length - 1 ? "border-b" : ""}>
                  <td className="px-4 py-3">
                    <Link to={item.linkTo} className="hover:underline font-medium">
                      {item.type === "variant" && item.productName
                        ? `${item.productName} — `
                        : ""}
                      {item.name}
                    </Link>
                    {item.sku && (
                      <span className="ml-2 text-xs text-muted-foreground">{item.sku}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px]">
                      {item.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-destructive">
                    {Number(item.stockQuantity)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {Number(item.lowStockAlert)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
