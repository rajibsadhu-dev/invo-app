import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { PlusIcon, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, Eye, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useGetEstimatesQuery, useDeleteEstimateMutation } from "@/features/estimate/estimateApi"
import { useGetCustomersQuery } from "@/features/customer/customerApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import type { EstimateStatus } from "@/types"
import { getApiErrorMessage } from "@/lib/apiError"

const STATUS_CONFIG: Record<EstimateStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft:     { label: "Draft",     variant: "secondary" },
  sent:      { label: "Sent",      variant: "outline" },
  accepted:  { label: "Accepted",  variant: "default" },
  rejected:  { label: "Rejected",  variant: "destructive" },
  expired:   { label: "Expired",   variant: "outline" },
  converted: { label: "Converted", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

export function EstimateStatusBadge({ status }: { status: EstimateStatus }) {
  const { label, variant } = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" }
  return <Badge variant={variant} className="capitalize">{label}</Badge>
}

const STATUS_TABS: { label: string; value: EstimateStatus | "all" }[] = [
  { label: "All",       value: "all" },
  { label: "Draft",     value: "draft" },
  { label: "Sent",      value: "sent" },
  { label: "Accepted",  value: "accepted" },
  { label: "Rejected",  value: "rejected" },
  { label: "Expired",   value: "expired" },
  { label: "Converted", value: "converted" },
  { label: "Cancelled", value: "cancelled" },
]

export default function EstimatesPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const id = Number(orgId)

  const [activeTab, setActiveTab] = useState<EstimateStatus | "all">("all")
  const [page, setPage] = useState(1)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [customerId, setCustomerId] = useState<string>("")
  const limit = 10

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  const { data: customersData } = useGetCustomersQuery({ orgId: id, limit: 100 })
  const customers = customersData?.data ?? []

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Estimates" },
  ])

  const { data, isLoading, isError } = useGetEstimatesQuery({
    orgId: id,
    status: activeTab === "all" ? undefined : activeTab,
    customerId: customerId ? Number(customerId) : undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    page,
    limit,
  })

  const [deleteEstimate, { isLoading: isDeleting }] = useDeleteEstimateMutation()

  const estimates = data?.data ?? []
  const meta = data?.meta

  const handleTabChange = (tab: EstimateStatus | "all") => {
    setActiveTab(tab)
    setPage(1)
  }

  const handleDelete = async (estimateId: number) => {
    try {
      await deleteEstimate({ orgId: id, estimateId }).unwrap()
      toast.success("Estimate deleted")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete estimate"))
    }
  }

  const hasFilters = fromDate || toDate || customerId
  const clearFilters = () => {
    setFromDate("")
    setToDate("")
    setCustomerId("")
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Estimates</h1>
          <p className="text-sm text-muted-foreground">
            {org?.name ?? "Organization"} · {meta?.total ?? 0} total
          </p>
        </div>
        <Button size="sm" onClick={() => navigate(`/org/${id}/estimates/new`)}>
          <PlusIcon /> New Estimate
        </Button>
      </div>

      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit flex-wrap">
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

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">From Date</label>
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">To Date</label>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1) }}
            className="w-40"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Customer</label>
          <Combobox
            value={customerId}
            onChange={(v) => { setCustomerId(v); setPage(1) }}
            options={customers.map((c) => ({ value: String(c.id), label: c.name }))}
            placeholder="All customers"
            searchPlaceholder="Search customers…"
            emptyText="No customers found"
            className="w-52"
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estimate #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Loading estimates…
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-destructive">
                  Failed to load estimates
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && estimates.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No estimates found
                </TableCell>
              </TableRow>
            )}
            {estimates.map((estimate) => (
              <TableRow key={estimate.id} className="cursor-pointer" onClick={() => navigate(`/org/${id}/estimates/${estimate.id}`)}>
                <TableCell className="font-medium">{estimate.estimateNumber}</TableCell>
                <TableCell className="text-muted-foreground">{estimate.customer?.name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(estimate.estimateDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {estimate.validUntil ? new Date(estimate.validUntil).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {Number(estimate.grandTotal).toFixed(2)}
                </TableCell>
                <TableCell>
                  <EstimateStatusBadge status={estimate.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/org/${id}/estimates/${estimate.id}`)}>
                      <Eye /><span className="sr-only">View</span>
                    </Button>
                    {estimate.status === "draft" && (
                      <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/org/${id}/estimates/${estimate.id}/edit`)}>
                        <Pencil /><span className="sr-only">Edit</span>
                      </Button>
                    )}
                    {["draft", "cancelled"].includes(estimate.status) && (
                      <AlertDialog>
                        <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                          <Trash2 className="text-destructive" /><span className="sr-only">Delete</span>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete estimate?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete <strong>{estimate.estimateNumber}</strong>. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={() => handleDelete(estimate.id)}>
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

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {meta.page} of {meta.totalPages} · {meta.total} estimates</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon-sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
