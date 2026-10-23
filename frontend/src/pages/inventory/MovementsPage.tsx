import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowDown, ArrowUp, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGetOrgMovementsQuery } from "@/features/inventory/inventoryApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"

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

export default function MovementsPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const id = Number(orgId)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Inventory", to: `/org/${id}/inventory` },
    { label: "Movements" },
  ])

  const { data, isLoading } = useGetOrgMovementsQuery({
    orgId: id,
    page,
    limit: 25,
    ...(typeFilter !== "all" ? { type: typeFilter } : {}),
  })

  const movements = data?.data ?? []
  const meta = data?.meta

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h1 className="font-heading text-xl font-semibold">Stock Movements</h1>
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v ?? "all"); setPage(1) }}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="sale">Sale</SelectItem>
            <SelectItem value="purchase">Purchase</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
            <SelectItem value="return">Return</SelectItem>
            <SelectItem value="opening">Opening</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      )}

      {!isLoading && movements.length === 0 && (
        <div className="rounded-xl bg-card p-8 text-center ring-1 ring-foreground/10">
          <p className="text-sm text-muted-foreground">No stock movements found.</p>
        </div>
      )}

      {movements.length > 0 && (
        <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Variant</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3">By</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m, i) => {
                  const qty = Number(m.quantity)
                  return (
                    <tr key={m.id} className={i < movements.length - 1 ? "border-b" : ""}>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/org/${id}/products/${m.productId}`} className="hover:underline font-medium">
                          {m.product.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.variant?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <MovementTypeBadge type={m.type} />
                      </td>
                      <td className={`px-4 py-3 text-right font-medium whitespace-nowrap ${qty > 0 ? "text-green-600" : "text-red-600"}`}>
                        <span className="inline-flex items-center gap-0.5">
                          {qty > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {Math.abs(qty)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {m.user.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[200px]">
                        {m.notes ?? "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
              <span>
                Page {meta.page} of {meta.totalPages} ({meta.total} total)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
