import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  PlusIcon,
  Trash2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Combobox } from "@/components/ui/combobox"
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
  useGetPurchaseOrdersQuery,
  useDeletePurchaseOrderMutation,
} from "@/features/purchase-order/purchaseOrderApi"
import { useGetSuppliersQuery } from "@/features/supplier/supplierApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import { formatINR } from "@/lib/money"
import type { POStatus } from "@/types"
import { getApiErrorMessage } from "@/lib/apiError"

// ─── Status Badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  POStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  ordered: { label: "Ordered", variant: "outline" },
  partially_received: { label: "Partial", variant: "default" },
  received: { label: "Received", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

export function POStatusBadge({ status }: { status: POStatus }) {
  const { label, variant } = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "secondary" as const,
  }
  return (
    <Badge variant={variant} className="capitalize">
      {label}
    </Badge>
  )
}

// ─── Status Tabs ──────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: POStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Ordered", value: "ordered" },
  { label: "Partial", value: "partially_received" },
  { label: "Received", value: "received" },
  { label: "Cancelled", value: "cancelled" },
]

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PurchaseOrdersPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const id = Number(orgId)

  const [activeTab, setActiveTab] = useState<POStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [supplierId, setSupplierId] = useState("")
  const limit = 10

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  const { data: suppliersData } = useGetSuppliersQuery({ orgId: id, limit: 100 })
  const suppliers = suppliersData?.data ?? []

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Purchase Orders" },
  ])

  const filters: string[] = []
  if (activeTab !== "all") filters.push(`status = '${activeTab}'`)
  if (supplierId) filters.push(`supplierId = ${supplierId}`)

  const { data, isLoading, isError } = useGetPurchaseOrdersQuery({
    orgId: id,
    filter: filters.length ? filters : undefined,
    page,
    limit,
  })

  const [deletePO, { isLoading: isDeleting }] = useDeletePurchaseOrderMutation()

  const purchaseOrders = data?.data ?? []
  const meta = data?.meta

  const handleTabChange = (tab: POStatus | "all") => {
    setActiveTab(tab)
    setPage(1)
  }

  const handleDelete = async (poId: number) => {
    try {
      await deletePO({ orgId: id, poId }).unwrap()
      toast.success("Purchase order deleted")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete purchase order"))
    }
  }

  const hasFilters = !!supplierId
  const clearFilters = () => {
    setSupplierId("")
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">
            {org?.name ?? "Organization"} · {meta?.total ?? 0} total
          </p>
        </div>
        <Button size="sm" onClick={() => navigate(`/org/${id}/purchase-orders/new`)}>
          <PlusIcon /> New PO
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Supplier</label>
          <Combobox
            value={supplierId}
            onChange={(v) => {
              setSupplierId(v)
              setPage(1)
            }}
            options={suppliers.map((s) => ({ value: String(s.id), label: s.name }))}
            placeholder="All suppliers"
            searchPlaceholder="Search suppliers…"
            emptyText="No suppliers found"
            className="w-52"
          />
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Loading purchase orders…
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-destructive">
                  Failed to load purchase orders
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && purchaseOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {activeTab !== "all" || hasFilters
                        ? "No purchase orders match your filters"
                        : "No purchase orders yet"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {purchaseOrders.map((po) => (
              <TableRow
                key={po.id}
                className="cursor-pointer"
                onClick={() => navigate(`/org/${id}/purchase-orders/${po.id}`)}
              >
                <TableCell className="font-medium">{po.poNumber}</TableCell>
                <TableCell className="text-muted-foreground">
                  {po.supplier?.name ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {new Date(po.poDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatINR(Number(po.grandTotal))}
                </TableCell>
                <TableCell>
                  <POStatusBadge status={po.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => navigate(`/org/${id}/purchase-orders/${po.id}`)}
                    >
                      <Eye />
                    </Button>
                    {(po.status === "draft" || po.status === "cancelled") && (
                      <AlertDialog>
                        <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                          <Trash2 className="text-destructive" />
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete purchase order?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete <strong>{po.poNumber}</strong>. Only
                              draft and cancelled POs can be deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              disabled={isDeleting}
                              onClick={() => handleDelete(po.id)}
                            >
                              {isDeleting && <Loader2 className="animate-spin" />} Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
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
            Page {meta.page} of {meta.totalPages} · {meta.total} purchase orders
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
    </div>
  )
}
