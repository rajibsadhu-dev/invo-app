import { useParams, Link } from "react-router-dom"
import { Truck, Mail, Phone, MapPin, Hash, User, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useGetSupplierByIdQuery } from "@/features/supplier/supplierApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useGetPurchaseOrdersQuery } from "@/features/purchase-order/purchaseOrderApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import { formatINR } from "@/lib/money"

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  ordered: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  partially_received: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  received: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export default function SupplierDetailPage() {
  const { orgId, supplierId } = useParams<{ orgId: string; supplierId: string }>()
  const id = Number(orgId)
  const sid = Number(supplierId)

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data
  const { data: supplierData, isLoading } = useGetSupplierByIdQuery({ orgId: id, supplierId: sid })
  const supplier = supplierData?.data

  const { data: poData } = useGetPurchaseOrdersQuery({
    orgId: id,
    filter: `supplierId = ${sid}`,
    limit: 10,
  })
  const recentPOs = poData?.data ?? []

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Suppliers", to: `/org/${id}/suppliers` },
    { label: supplier?.name ?? "Supplier" },
  ])

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
  }

  if (!supplier) {
    return <p className="text-sm text-destructive py-8 text-center">Supplier not found</p>
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Truck className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-semibold">{supplier.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {supplier.contactPerson && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" /> {supplier.contactPerson}
                </span>
              )}
              <Badge variant={supplier.isActive ? "outline" : "secondary"} className="text-[10px]">
                {supplier.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>
        <Link
          to={`/org/${id}/purchase-orders/new?supplierId=${sid}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <FileText className="h-4 w-4" /> New PO
        </Link>
      </div>

      {/* Contact info */}
      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h3 className="font-heading text-sm font-semibold mb-3">Contact Information</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
          {supplier.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" /> {supplier.email}
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" /> {supplier.phone}
            </div>
          )}
          {supplier.address && (
            <div className="flex items-start gap-2 text-muted-foreground sm:col-span-2">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" /> {supplier.address}
            </div>
          )}
          {supplier.gstNumber && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="h-4 w-4 shrink-0" /> GST: {supplier.gstNumber}
              {supplier.stateCode && ` (State: ${supplier.stateCode})`}
            </div>
          )}
        </div>
        {supplier.notes && (
          <p className="mt-3 text-xs text-muted-foreground border-t pt-3">{supplier.notes}</p>
        )}
      </div>

      {/* Recent POs */}
      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-sm font-semibold">Recent Purchase Orders</h3>
          {(poData?.meta?.total ?? 0) > 10 && (
            <Link
              to={`/org/${id}/purchase-orders?supplierId=${sid}`}
              className="text-xs text-primary hover:underline"
            >
              View all
            </Link>
          )}
        </div>
        {recentPOs.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3">No purchase orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">PO #</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentPOs.map((po) => (
                  <tr key={po.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <Link to={`/org/${id}/purchase-orders/${po.id}`} className="hover:underline font-medium">
                        {po.poNumber}
                      </Link>
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {new Date(po.poDate).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[po.status] ?? ""}`}>
                        {po.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium">
                      {formatINR(Number(po.grandTotal))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
