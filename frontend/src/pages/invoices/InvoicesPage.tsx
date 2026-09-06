import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { PlusIcon, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useGetInvoicesQuery, useDeleteInvoiceMutation } from "@/features/invoice/invoiceApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import type { InvoiceStatus } from "@/types"
import { getApiErrorMessage } from "@/lib/apiError"

// ─── Status Badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft:     { label: "Draft",     variant: "secondary" },
  sent:      { label: "Sent",      variant: "outline" },
  paid:      { label: "Paid",      variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
}

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const { label, variant } = STATUS_CONFIG[status] ?? { label: status, variant: "secondary" }
  return <Badge variant={variant} className="capitalize">{label}</Badge>
}

// ─── Status Tabs ───────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: InvoiceStatus | "all" }[] = [
  { label: "All",       value: "all" },
  { label: "Draft",     value: "draft" },
  { label: "Sent",      value: "sent" },
  { label: "Paid",      value: "paid" },
  { label: "Cancelled", value: "cancelled" },
]

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const id = Number(orgId)

  const [activeTab, setActiveTab] = useState<InvoiceStatus | "all">("all")
  const [page, setPage] = useState(1)
  const limit = 10

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Invoices" },
  ])

  const { data, isLoading, isError } = useGetInvoicesQuery({
    orgId: id,
    status: activeTab === "all" ? undefined : activeTab,
    page,
    limit,
  })

  const [deleteInvoice, { isLoading: isDeleting }] = useDeleteInvoiceMutation()

  const invoices = data?.data ?? []
  const meta = data?.meta

  const handleTabChange = (tab: InvoiceStatus | "all") => {
    setActiveTab(tab)
    setPage(1)
  }

  const handleDelete = async (invoiceId: number) => {
    try {
      await deleteInvoice({ orgId: id, invoiceId }).unwrap()
      toast.success("Invoice deleted")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete invoice"))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Invoices</h1>
          <p className="text-sm text-muted-foreground">
            {org?.name ?? "Organization"} · {meta?.total ?? 0} total
          </p>
        </div>
        <Button size="sm" onClick={() => navigate(`/org/${id}/invoices/new`)}>
          <PlusIcon /> New Invoice
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

      {/* Table */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Loading invoices…
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-destructive">
                  Failed to load invoices
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No invoices found
                </TableCell>
              </TableRow>
            )}
            {invoices.map((invoice) => (
              <TableRow key={invoice.id} className="cursor-pointer" onClick={() => navigate(`/org/${id}/invoices/${invoice.id}`)}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell className="text-muted-foreground">{invoice.customer?.name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {Number(invoice.grandTotal).toFixed(2)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={invoice.status} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/org/${id}/invoices/${invoice.id}`)}>
                      <Eye /><span className="sr-only">View</span>
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/org/${id}/invoices/${invoice.id}/edit`)}>
                      <Pencil /><span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <Trash2 className="text-destructive" /><span className="sr-only">Delete</span>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong>{invoice.invoiceNumber}</strong>. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={() => handleDelete(invoice.id)}>
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
          <span>Page {meta.page} of {meta.totalPages} · {meta.total} invoices</span>
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
