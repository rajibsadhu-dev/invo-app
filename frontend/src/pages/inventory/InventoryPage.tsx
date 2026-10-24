import { useParams, Link } from "react-router-dom"
import { Warehouse, AlertTriangle, History, Package, IndianRupee } from "lucide-react"
import { useGetInventorySummaryQuery, useGetLowStockQuery, useGetInventoryValuationQuery } from "@/features/inventory/inventoryApi"
import { formatINR } from "@/lib/money"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"

function StatCard({
  label,
  value,
  icon: Icon,
  className,
  to,
}: {
  label: string
  value: React.ReactNode
  icon: React.ElementType
  className?: string
  to?: string
}) {
  const content = (
    <div className={`rounded-xl bg-card p-5 ring-1 ring-foreground/10 ${to ? "hover:ring-primary/30 transition-colors" : ""} ${className ?? ""}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4.5 w-4.5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold">{value}</p>
        </div>
      </div>
    </div>
  )
  if (to) return <Link to={to}>{content}</Link>
  return content
}

export default function InventoryPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const id = Number(orgId)

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Inventory" },
  ])

  const { data: summaryData, isLoading } = useGetInventorySummaryQuery(id)
  const summary = summaryData?.data

  const { data: lowStockData } = useGetLowStockQuery(id)
  const lowStockCount = lowStockData?.data?.totalCount ?? 0

  const { data: valuationData } = useGetInventoryValuationQuery(id)
  const valuation = valuationData?.data

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-center gap-2">
        <Warehouse className="h-5 w-5 text-muted-foreground" />
        <h1 className="font-heading text-xl font-semibold">Inventory</h1>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Tracked Items"
              value={summary.totalProducts}
              icon={Package}
            />
            <StatCard
              label="Product Stock"
              value={Number(summary.totalProductStock).toLocaleString()}
              icon={Warehouse}
            />
            <StatCard
              label="Variant Stock"
              value={Number(summary.totalVariantStock).toLocaleString()}
              icon={Warehouse}
            />
            <StatCard
              label="Low Stock"
              value={lowStockCount}
              icon={AlertTriangle}
              className={lowStockCount > 0 ? "ring-destructive/30" : ""}
              to={`/org/${id}/inventory/low-stock`}
            />
          </div>

          {summary.byCategory.length > 0 && (
            <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <h3 className="font-heading text-sm font-semibold mb-3">Products by Category</h3>
              <div className="space-y-2">
                {summary.byCategory.map((cat) => (
                  <div key={cat.categoryId ?? "none"} className="flex items-center justify-between text-sm">
                    <span>{cat.categoryName}</span>
                    <span className="text-muted-foreground">{cat.productCount} product{cat.productCount === 1 ? "" : "s"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {valuation && (
            <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <h3 className="font-heading text-sm font-semibold mb-3">Inventory Valuation</h3>
              <div className="flex items-baseline gap-2 mb-3">
                <IndianRupee className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold tabular-nums">{formatINR(Number(valuation.totalValue))}</span>
                <span className="text-sm text-muted-foreground">total stock value</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Products</span>
                  <span className="font-medium tabular-nums">{formatINR(Number(valuation.productValue))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Variants</span>
                  <span className="font-medium tabular-nums">{formatINR(Number(valuation.variantValue))}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Based on purchase price (falls back to selling price when no purchase price is set).
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Link
              to={`/org/${id}/inventory/movements`}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              <History className="h-4 w-4" /> View All Movements
            </Link>
            <Link
              to={`/org/${id}/inventory/low-stock`}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              <AlertTriangle className="h-4 w-4" /> Low Stock Alerts
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
