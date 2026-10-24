import { useRef, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { Pencil, Trash2, Loader2, Printer, Send, ArrowRightLeft, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { useReactToPrint } from "react-to-print"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  useGetEstimateByIdQuery,
  useDeleteEstimateMutation,
  useUpdateEstimateStatusMutation,
  useConvertToInvoiceMutation,
} from "@/features/estimate/estimateApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import { EstimateStatusBadge } from "./EstimatesPage"
import PrintableInvoice from "../invoices/PrintableInvoice"
import { SendEstimateDialog } from "./SendEstimateDialog"
import { formatINR } from "@/lib/money"
import type { EstimateStatus } from "@/types"
import { getApiErrorMessage } from "@/lib/apiError"

export default function EstimateDetailPage() {
  const { orgId, estimateId } = useParams<{ orgId: string; estimateId: string }>()
  const navigate = useNavigate()
  const oId = Number(orgId)
  const eId = Number(estimateId)

  const printRef = useRef<HTMLDivElement>(null)
  const [sendOpen, setSendOpen] = useState(false)

  const { data: orgData } = useGetOrganizationByIdQuery(oId)
  const org = orgData?.data

  const { data, isLoading, isError } = useGetEstimateByIdQuery({ orgId: oId, estimateId: eId })
  const estimate = data?.data

  const [updateStatus, { isLoading: isUpdating }] = useUpdateEstimateStatusMutation()
  const [deleteEstimate, { isLoading: isDeleting }] = useDeleteEstimateMutation()
  const [convertToInvoice, { isLoading: isConverting }] = useConvertToInvoiceMutation()

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${oId}` },
    { label: "Estimates", to: `/org/${oId}/estimates` },
    { label: estimate?.estimateNumber ?? "Estimate" },
  ])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: estimate?.estimateNumber ?? "Estimate",
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !estimate) {
    return (
      <div className="rounded-xl bg-destructive/10 px-4 py-8 text-center text-sm text-destructive">
        Estimate not found or access denied.
      </div>
    )
  }

  const handleStatusChange = async (status: EstimateStatus) => {
    try {
      await updateStatus({ orgId: oId, estimateId: eId, status }).unwrap()
      toast.success("Status updated")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update status"))
    }
  }

  const handleDelete = async () => {
    try {
      await deleteEstimate({ orgId: oId, estimateId: eId }).unwrap()
      toast.success("Estimate deleted")
      navigate(`/org/${oId}/estimates`, { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete estimate"))
    }
  }

  const handleConvert = async () => {
    try {
      const result = await convertToInvoice({ orgId: oId, estimateId: eId }).unwrap()
      toast.success("Estimate converted — draft invoice created")
      navigate(`/org/${oId}/invoices/${result.data.invoice.id}`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to convert to invoice"))
    }
  }

  const subtotal = Number(estimate.subtotal)
  const discount = Number(estimate.discount)
  const taxableValue = Number(estimate.taxableValue ?? subtotal - discount)
  const cgstTotal = Number(estimate.cgstTotal ?? 0)
  const sgstTotal = Number(estimate.sgstTotal ?? 0)
  const igstTotal = Number(estimate.igstTotal ?? 0)
  const roundOff = Number(estimate.roundOff ?? 0)
  const grandTotal = Number(estimate.grandTotal)

  const logoUrl = org?.logo ? `${import.meta.env.VITE_API_URL}/uploads/${org.logo}` : null

  const estimateDateStr = estimate.estimateDate
    ? new Date(estimate.estimateDate).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : "—"

  const validUntilStr = estimate.validUntil
    ? new Date(estimate.validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
    : null

  const isDraft = estimate.status === "draft"
  const isSent = estimate.status === "sent"
  const isAccepted = estimate.status === "accepted"
  const isConverted = estimate.status === "converted"
  const canEdit = isDraft
  const canDelete = isDraft || estimate.status === "cancelled"
  const canSend = isDraft || isSent

  const printData = {
    ...estimate,
    invoiceNumber: estimate.estimateNumber,
    invoiceDate: estimate.estimateDate,
    receivedAmount: 0,
    balanceDue: grandTotal,
  } as unknown as import("@/types").Invoice

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Page actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <EstimateStatusBadge status={estimate.status} />
          {validUntilStr && (
            <span className="text-xs text-muted-foreground">Valid until {validUntilStr}</span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button size="sm" variant="outline" onClick={() => handlePrint()}>
            <Printer className="h-3.5 w-3.5" /> Print / PDF
          </Button>

          {canSend && (
            <Button size="sm" variant="outline" onClick={() => setSendOpen(true)}>
              <Send className="h-3.5 w-3.5" /> Send
            </Button>
          )}

          {isSent && (
            <>
              <Button size="sm" variant="outline" disabled={isUpdating} onClick={() => handleStatusChange("accepted")}>
                Accept
              </Button>
              <Button size="sm" variant="outline" disabled={isUpdating} onClick={() => handleStatusChange("rejected")}>
                Reject
              </Button>
              <Button size="sm" variant="outline" disabled={isUpdating} onClick={() => handleStatusChange("cancelled")}>
                Cancel
              </Button>
            </>
          )}

          {isDraft && (
            <Button size="sm" variant="outline" disabled={isUpdating} onClick={() => handleStatusChange("cancelled")}>
              Cancel
            </Button>
          )}

          {isAccepted && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button size="sm" variant="outline" disabled={isConverting} />}>
                <ArrowRightLeft className="h-3.5 w-3.5" /> Convert to Invoice
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Convert to Invoice?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will create a new <strong>draft invoice</strong> with all items from this estimate.
                    You can review and send it separately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={isConverting} onClick={handleConvert}>
                    {isConverting && <Loader2 className="animate-spin" />} Convert
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {isConverted && estimate.convertedToInvoiceId && (
            <Button size="sm" variant="outline" asChild>
              <Link to={`/org/${oId}/invoices/${estimate.convertedToInvoiceId}`}>
                <ExternalLink className="h-3.5 w-3.5" /> View Invoice
              </Link>
            </Button>
          )}

          {canEdit && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/org/${oId}/estimates/${eId}/edit`)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          )}

          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button size="sm" variant="outline" className="text-destructive hover:text-destructive" />}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
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
                  <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={handleDelete}>
                    {isDeleting && <Loader2 className="animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Estimate document — screen view */}
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
            <p className="font-heading text-2xl font-bold tracking-tight">ESTIMATE</p>
            <p className="text-sm font-medium">{estimate.estimateNumber}</p>
            <p className="text-sm text-muted-foreground">{estimateDateStr}</p>
            {validUntilStr && (
              <p className="text-xs text-muted-foreground">Valid Until: {validUntilStr}</p>
            )}
            <p className="text-xs text-muted-foreground">Challan: {estimate.challanNo || <span className="italic opacity-50">—</span>}</p>
            <p className="text-xs text-muted-foreground">Vehicle: {estimate.vehicleNo || <span className="italic opacity-50">—</span>}</p>
            <p className="text-xs text-muted-foreground">Site: {estimate.siteLocation || <span className="italic opacity-50">—</span>}</p>
            <p className="text-xs text-muted-foreground">Ref: {estimate.referenceNumber || <span className="italic opacity-50">—</span>}</p>
          </div>
        </div>

        {/* Bill To */}
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">To</p>
          <p className="font-medium">{estimate.customer?.name}</p>
          {estimate.billingAddress && <p className="text-sm text-muted-foreground">{estimate.billingAddress}</p>}
        </div>

        {/* Items table */}
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">#</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">HSN/SAC</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Unit</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Qty</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Rate (₹)</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">GST %</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(estimate.items ?? []).map((item, i) => (
                <tr key={item.id}>
                  <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2.5">{item.description}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{item.hsnCode || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{item.unit || "—"}</td>
                  <td className="px-4 py-2.5 text-right">{Number(item.quantity)}</td>
                  <td className="px-4 py-2.5 text-right">{formatINR(item.rate)}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    {Number(item.gstRate ?? 0)}%
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium">{formatINR(item.amount)}</td>
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
              <span>{formatINR(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>− {formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxable Value</span>
              <span>{formatINR(taxableValue)}</span>
            </div>
            {cgstTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">CGST</span>
                <span>+ {formatINR(cgstTotal)}</span>
              </div>
            )}
            {sgstTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">SGST</span>
                <span>+ {formatINR(sgstTotal)}</span>
              </div>
            )}
            {igstTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IGST</span>
                <span>+ {formatINR(igstTotal)}</span>
              </div>
            )}
            {roundOff !== 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Round Off</span>
                <span>
                  {roundOff < 0 ? "− " : "+ "}
                  {formatINR(Math.abs(roundOff))}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-1.5 text-base font-semibold">
              <span>Grand Total</span>
              <span>{formatINR(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Amount in words */}
        {estimate.amountInWords && (
          <div className="rounded-lg bg-muted/40 px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Amount in Words: </span>
            <span className="text-sm italic">{estimate.amountInWords}</span>
          </div>
        )}

        {/* Terms & Notes */}
        <Separator />
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Terms & Conditions</p>
            {estimate.termsAndConditions
              ? <p className="text-sm whitespace-pre-wrap">{estimate.termsAndConditions}</p>
              : <p className="text-sm italic text-muted-foreground/50">—</p>
            }
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Notes</p>
            {estimate.notes
              ? <p className="text-sm whitespace-pre-wrap">{estimate.notes}</p>
              : <p className="text-sm italic text-muted-foreground/50">—</p>
            }
          </div>
        </div>

        {/* Authorized Signatory */}
        <Separator />
        <div className="flex justify-end">
          <div className="text-center text-sm">
            <div className="mb-6 h-px w-40 border-t border-dashed" />
            <p className="font-medium">{estimate.authorizedSignatory || <span className="italic text-muted-foreground/50">—</span>}</p>
            <p className="text-xs text-muted-foreground">Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* Off-screen printable estimate */}
      {org && (
        <div style={{ position: "absolute", left: "-9999px", top: 0, zIndex: -1 }}>
          <PrintableInvoice
            ref={printRef}
            invoice={printData}
            org={org}
            logoUrl={logoUrl}
            qrDataUrl={null}
            documentTitle="Estimate"
            showPayment={false}
          />
        </div>
      )}

      {org && (
        <SendEstimateDialog
          open={sendOpen}
          onOpenChange={setSendOpen}
          orgId={oId}
          estimate={estimate}
          org={org}
        />
      )}
    </div>
  )
}
