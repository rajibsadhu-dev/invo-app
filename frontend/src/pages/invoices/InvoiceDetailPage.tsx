import { useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Pencil, Trash2, Loader2, Printer } from "lucide-react"
import { toast } from "sonner"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useGetInvoiceByIdQuery, useUpdateInvoiceMutation, useDeleteInvoiceMutation } from "@/features/invoice/invoiceApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/BreadcrumbContext"
import { StatusBadge } from "./InvoicesPage"
import PrintableInvoice from "./PrintableInvoice"
import type { InvoiceStatus } from "@/types"

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: "draft",     label: "Draft" },
  { value: "sent",      label: "Sent" },
  { value: "paid",      label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
]

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-right max-w-[60%] ${!value && value !== 0 ? "text-muted-foreground/50 italic" : ""}`}>
        {value !== null && value !== undefined && value !== "" ? value : "—"}
      </span>
    </div>
  )
}

export default function InvoiceDetailPage() {
  const { orgId, invoiceId } = useParams<{ orgId: string; invoiceId: string }>()
  const navigate = useNavigate()
  const oId = Number(orgId)
  const iId = Number(invoiceId)

  const printRef = useRef<HTMLDivElement>(null)

  const { data: orgData } = useGetOrganizationByIdQuery(oId)
  const org = orgData?.data

  const { data, isLoading, isError } = useGetInvoiceByIdQuery({ orgId: oId, invoiceId: iId })
  const invoice = data?.data

  const [updateInvoice, { isLoading: isUpdating }] = useUpdateInvoiceMutation()
  const [deleteInvoice, { isLoading: isDeleting }] = useDeleteInvoiceMutation()

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${oId}` },
    { label: "Invoices", to: `/org/${oId}/invoices` },
    { label: invoice?.invoiceNumber ?? "Invoice" },
  ])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoice?.invoiceNumber ?? "Invoice",
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !invoice) {
    return (
      <div className="rounded-xl bg-destructive/10 px-4 py-8 text-center text-sm text-destructive">
        Invoice not found or access denied.
      </div>
    )
  }

  const handleStatusChange = async (status: InvoiceStatus) => {
    try {
      await updateInvoice({ orgId: oId, invoiceId: iId, body: { status } }).unwrap()
      toast.success("Status updated")
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update status")
    }
  }

  const handleDelete = async () => {
    try {
      await deleteInvoice({ orgId: oId, invoiceId: iId }).unwrap()
      toast.success("Invoice deleted")
      navigate(`/org/${oId}/invoices`, { replace: true })
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to delete invoice")
    }
  }

  const subtotal = Number(invoice.subtotal)
  const tax = Number(invoice.tax)
  const discount = Number(invoice.discount)
  const grandTotal = Number(invoice.grandTotal)
  const receivedAmount = Number(invoice.receivedAmount)
  const balanceDue = invoice.balanceDue
  const logoUrl = org?.logo ? `${import.meta.env.VITE_API_URL}/uploads/${org.logo}` : null

  const invoiceDateStr = invoice.invoiceDate
    ? new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : new Date(invoice.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Page actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusBadge status={invoice.status} />
          <Select
            value={invoice.status}
            onValueChange={(v) => handleStatusChange(v as InvoiceStatus)}
            disabled={isUpdating}
          >
            <SelectTrigger className="h-7 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handlePrint()}>
            <Printer className="h-3.5 w-3.5" /> Print / PDF
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate(`/org/${oId}/invoices/${iId}/edit`)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger render={<Button size="sm" variant="outline" className="text-destructive hover:text-destructive" />}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
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
                <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={handleDelete}>
                  {isDeleting && <Loader2 className="animate-spin" />} Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Invoice document — screen view */}
      <div className="rounded-xl border bg-card p-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <img src={logoUrl} alt={org?.name} className="h-12 w-12 rounded-lg object-cover ring-1 ring-foreground/10" />
            )}
            <div>
              <p className="font-heading text-lg font-semibold">{org?.name}</p>
              {org?.address && <p className="text-sm text-muted-foreground">{org.address}</p>}
              {org?.phone && <p className="text-sm text-muted-foreground">{org.phone}</p>}
              {org?.email && <p className="text-sm text-muted-foreground">{org.email}</p>}
              {org?.gstNumber && <p className="text-sm text-muted-foreground">GST: {org.gstNumber}</p>}
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading text-2xl font-bold tracking-tight">INVOICE</p>
            <p className="text-sm font-medium">{invoice.invoiceNumber}</p>
            <p className="text-sm text-muted-foreground">{invoiceDateStr}</p>
            <p className="text-xs text-muted-foreground">Challan: {invoice.challanNo || <span className="italic opacity-50">—</span>}</p>
            <p className="text-xs text-muted-foreground">Vehicle: {invoice.vehicleNo || <span className="italic opacity-50">—</span>}</p>
            <p className="text-xs text-muted-foreground">Site: {invoice.siteLocation || <span className="italic opacity-50">—</span>}</p>
            <p className="text-xs text-muted-foreground">Ref: {invoice.referenceNumber || <span className="italic opacity-50">—</span>}</p>
          </div>
        </div>

        {/* Bill To */}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Bill To</p>
          <p className="font-medium">{invoice.customer?.name}</p>
          {invoice.billingAddress && <p className="text-sm text-muted-foreground">{invoice.billingAddress}</p>}
        </div>

        {/* Items table */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">#</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Unit</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Qty</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Rate (₹)</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(invoice.items ?? []).map((item, i) => (
                <tr key={item.id}>
                  <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2.5">{item.description}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{item.unit || "—"}</td>
                  <td className="px-4 py-2.5 text-right">{Number(item.quantity)}</td>
                  <td className="px-4 py-2.5 text-right">₹ {Number(item.rate).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right font-medium">₹ {Number(item.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST / Tax</span>
              <span>+ ₹ {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>− ₹ {discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5 font-semibold text-base">
              <span>Grand Total</span>
              <span>₹ {grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Received</span>
              <span>− ₹ {receivedAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-1.5 font-semibold text-sm text-destructive">
              <span>Balance Due</span>
              <span>₹ {balanceDue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Amount in words */}
        {invoice.amountInWords && (
          <div className="rounded-lg bg-muted/40 px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Amount in Words: </span>
            <span className="text-sm italic">{invoice.amountInWords}</span>
          </div>
        )}

        {/* Payment info */}
        <Separator />
        <div className="flex flex-col gap-1.5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Payment Details</p>
          <InfoRow
            label="Method"
            value={invoice.paymentMethod === "cash" ? "Cash" : invoice.paymentMethod === "bank" ? "Bank Transfer" : invoice.paymentMethod === "upi" ? "UPI / Online" : null}
          />
          <InfoRow label="Bank" value={invoice.bankName} />
          <InfoRow label="Account No." value={invoice.bankAccount} />
          <InfoRow label="IFSC" value={invoice.bankIfsc} />
          <InfoRow label="Transaction / UTR No." value={invoice.transactionNumber} />
        </div>

        {/* Terms & Notes */}
        <Separator />
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Terms & Conditions</p>
            {invoice.termsAndConditions
              ? <p className="text-sm whitespace-pre-wrap">{invoice.termsAndConditions}</p>
              : <p className="text-sm italic text-muted-foreground/50">—</p>
            }
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Notes</p>
            {invoice.notes
              ? <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              : <p className="text-sm italic text-muted-foreground/50">—</p>
            }
          </div>
        </div>

        {/* Authorized Signatory */}
        <Separator />
        <div className="flex justify-end">
          <div className="text-center text-sm">
            <div className="mb-6 h-px w-40 border-t border-dashed" />
            <p className="font-medium">{invoice.authorizedSignatory || <span className="italic text-muted-foreground/50">—</span>}</p>
            <p className="text-xs text-muted-foreground">Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* Off-screen printable invoice */}
      {org && (
        <div style={{ position: "absolute", left: "-9999px", top: 0, zIndex: -1 }}>
          <PrintableInvoice ref={printRef} invoice={invoice} org={org} logoUrl={logoUrl} />
        </div>
      )}
    </div>
  )
}
