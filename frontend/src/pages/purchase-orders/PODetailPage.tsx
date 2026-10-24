import { useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useReactToPrint } from "react-to-print"
import { Pencil, Trash2, Loader2, PackageCheck, Printer } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  useGetPurchaseOrderByIdQuery,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useReceiveGoodsMutation,
} from "@/features/purchase-order/purchaseOrderApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import { POStatusBadge } from "./PurchaseOrdersPage"
import PrintablePO from "./PrintablePO"
import { formatINR } from "@/lib/money"
import type { POStatus, PurchaseOrderItem } from "@/types"
import { getApiErrorMessage } from "@/lib/apiError"

const STATUS_LABELS: Record<POStatus, string> = {
  draft: "Draft",
  ordered: "Ordered",
  partially_received: "Partially Received",
  received: "Received",
  cancelled: "Cancelled",
}

const ALLOWED_TRANSITIONS: Record<POStatus, POStatus[]> = {
  draft: ["ordered", "cancelled"],
  ordered: ["cancelled"],
  partially_received: ["cancelled"],
  received: [],
  cancelled: [],
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-medium text-right max-w-[60%] ${!value && value !== 0 ? "text-muted-foreground/50 italic" : ""}`}
      >
        {value !== null && value !== undefined && value !== "" ? value : "—"}
      </span>
    </div>
  )
}

// ─── Receive Goods Dialog ────────────────────────────────────────────────────

function ReceiveGoodsDialog({
  orgId,
  poId,
  items,
  open,
  onOpenChange,
}: {
  orgId: number
  poId: number
  items: PurchaseOrderItem[]
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [receiveGoods, { isLoading }] = useReceiveGoodsMutation()
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  const receivableItems = items.filter((item) => {
    const remaining = Number(item.quantity) - Number(item.receivedQuantity)
    return remaining > 0
  })

  const handleReceive = async () => {
    const receiveItems = receivableItems
      .filter((item) => (quantities[item.id] ?? 0) > 0)
      .map((item) => ({
        itemId: item.id,
        quantity: quantities[item.id] ?? 0,
      }))

    if (receiveItems.length === 0) {
      toast.error("Enter at least one quantity to receive")
      return
    }

    try {
      await receiveGoods({
        orgId,
        poId,
        body: { items: receiveItems },
      }).unwrap()
      toast.success("Goods received successfully")
      setQuantities({})
      onOpenChange(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to receive goods"))
    }
  }

  const fillAll = () => {
    const filled: Record<number, number> = {}
    receivableItems.forEach((item) => {
      filled[item.id] = Number(item.quantity) - Number(item.receivedQuantity)
    })
    setQuantities(filled)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Receive Goods</DialogTitle>
        </DialogHeader>

        {receivableItems.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            All items have been fully received.
          </p>
        ) : (
          <>
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={fillAll}>
                Receive All
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pl-3 text-left">Item</th>
                    <th className="py-2 px-2 text-right">Ordered</th>
                    <th className="py-2 px-2 text-right">Received</th>
                    <th className="py-2 px-2 text-right">Remaining</th>
                    <th className="py-2 pr-3 text-right">Receive Now</th>
                  </tr>
                </thead>
                <tbody>
                  {receivableItems.map((item) => {
                    const ordered = Number(item.quantity)
                    const received = Number(item.receivedQuantity)
                    const remaining = ordered - received

                    return (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2 pl-3">
                          <div className="font-medium">{item.description}</div>
                          {item.variant && (
                            <span className="text-[10px] text-muted-foreground">
                              Variant: {item.variant.name}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 text-right tabular-nums">{ordered}</td>
                        <td className="py-2 px-2 text-right tabular-nums">{received}</td>
                        <td className="py-2 px-2 text-right tabular-nums">{remaining}</td>
                        <td className="py-2 pr-3">
                          <Input
                            type="number"
                            min={0}
                            max={remaining}
                            value={quantities[item.id] ?? ""}
                            onChange={(e) =>
                              setQuantities((prev) => ({
                                ...prev,
                                [item.id]: Math.min(
                                  Math.max(0, Number(e.target.value) || 0),
                                  remaining
                                ),
                              }))
                            }
                            className="h-8 w-20 ml-auto text-right"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <DialogFooter>
          <Button
            onClick={handleReceive}
            disabled={isLoading || receivableItems.length === 0}
          >
            {isLoading && <Loader2 className="animate-spin" />} Confirm Receipt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PODetailPage() {
  const { orgId, poId } = useParams<{ orgId: string; poId: string }>()
  const navigate = useNavigate()
  const oId = Number(orgId)
  const pId = Number(poId)

  const [receiveOpen, setReceiveOpen] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const { data: orgData } = useGetOrganizationByIdQuery(oId)
  const org = orgData?.data

  const { data, isLoading, isError } = useGetPurchaseOrderByIdQuery({ orgId: oId, poId: pId })
  const po = data?.data

  const [updatePO, { isLoading: isUpdating }] = useUpdatePurchaseOrderMutation()
  const [deletePO, { isLoading: isDeleting }] = useDeletePurchaseOrderMutation()

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${oId}` },
    { label: "Purchase Orders", to: `/org/${oId}/purchase-orders` },
    { label: po?.poNumber ?? "PO" },
  ])

  const logoUrl = org?.logo
    ? `${import.meta.env.VITE_API_URL}/uploads/${org.logo}`
    : null

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: po?.poNumber ?? "PO",
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !po) {
    return (
      <div className="rounded-xl bg-destructive/10 px-4 py-8 text-center text-sm text-destructive">
        Purchase order not found or access denied.
      </div>
    )
  }

  const handleStatusChange = async (status: POStatus) => {
    try {
      await updatePO({ orgId: oId, poId: pId, body: { status } }).unwrap()
      toast.success(`Status updated to ${STATUS_LABELS[status]}`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update status"))
    }
  }

  const handleDelete = async () => {
    try {
      await deletePO({ orgId: oId, poId: pId }).unwrap()
      toast.success("Purchase order deleted")
      navigate(`/org/${oId}/purchase-orders`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete purchase order"))
    }
  }

  const allowedTransitions = ALLOWED_TRANSITIONS[po.status] ?? []
  const canReceive = po.status === "ordered" || po.status === "partially_received"
  const canEdit = po.status === "draft"
  const canDelete = po.status === "draft" || po.status === "cancelled"

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl font-semibold">{po.poNumber}</h1>
            <POStatusBadge status={po.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {po.supplier?.name ?? "Unknown supplier"} ·{" "}
            {new Date(po.poDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handlePrint()}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          {canReceive && (
            <Button size="sm" onClick={() => setReceiveOpen(true)}>
              <PackageCheck className="h-4 w-4" /> Receive Goods
            </Button>
          )}
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/org/${oId}/purchase-orders/${pId}/edit`)}
            >
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="outline" size="sm" />}>
                <Trash2 className="h-4 w-4 text-destructive" /> Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete purchase order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete <strong>{po.poNumber}</strong>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={isDeleting}
                    onClick={handleDelete}
                  >
                    {isDeleting && <Loader2 className="animate-spin" />} Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Status Change + Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <h3 className="font-heading text-sm font-semibold mb-3">Order Info</h3>
          <InfoRow label="PO Number" value={po.poNumber} />
          <InfoRow label="Date" value={new Date(po.poDate).toLocaleDateString()} />
          <InfoRow
            label="Expected Delivery"
            value={po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : null}
          />
          <InfoRow label="Supplier" value={po.supplier?.name} />
          <Separator className="my-2" />
          <InfoRow label="Subtotal" value={formatINR(Number(po.subtotal))} />
          <InfoRow label="GST" value={formatINR(Number(po.taxTotal))} />
          <div className="flex justify-between text-sm py-0.5 font-semibold">
            <span>Grand Total</span>
            <span>{formatINR(Number(po.grandTotal))}</span>
          </div>
        </div>

        <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <h3 className="font-heading text-sm font-semibold mb-3">Status</h3>
          <div className="flex items-center gap-3 mb-3">
            <POStatusBadge status={po.status} />
            <span className="text-sm text-muted-foreground">
              {STATUS_LABELS[po.status]}
            </span>
          </div>
          {allowedTransitions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Change status:</p>
              <Select
                onValueChange={(v) => handleStatusChange(v as POStatus)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select status…" />
                </SelectTrigger>
                <SelectContent>
                  {allowedTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {po.notes && (
            <>
              <Separator className="my-3" />
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Notes</h4>
              <p className="text-sm whitespace-pre-wrap">{po.notes}</p>
            </>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
        <div className="px-5 py-3 border-b">
          <h3 className="font-heading text-sm font-semibold">Items</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pl-5 text-left">Description</th>
                <th className="py-2 px-3 text-left">HSN</th>
                <th className="py-2 px-3 text-left">Unit</th>
                <th className="py-2 px-3 text-right">Qty</th>
                <th className="py-2 px-3 text-right">Received</th>
                <th className="py-2 px-3 text-right">Rate</th>
                <th className="py-2 px-3 text-right">GST</th>
                <th className="py-2 pr-5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {(po.items ?? []).map((item) => {
                const amount = Number(item.amount)
                const gst = Number(item.gstAmount)
                const total = amount + gst
                const remaining =
                  Number(item.quantity) - Number(item.receivedQuantity)

                return (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-2.5 pl-5">
                      <div className="font-medium">{item.description}</div>
                      {item.variant && (
                        <span className="text-[10px] text-muted-foreground">
                          Variant: {item.variant.name}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      {item.hsnCode ?? "—"}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">
                      {item.unit ?? "—"}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {Number(item.quantity)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      <span
                        className={
                          remaining > 0 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
                        }
                      >
                        {Number(item.receivedQuantity)}
                      </span>
                      {remaining > 0 && (
                        <span className="text-[10px] text-muted-foreground ml-1">
                          ({remaining} left)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {formatINR(Number(item.rate))}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-xs">
                      {Number(item.gstRate)}%
                      <span className="block text-muted-foreground">
                        {formatINR(gst)}
                      </span>
                    </td>
                    <td className="py-2.5 pr-5 text-right tabular-nums font-medium">
                      {formatINR(total)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/30">
                <td colSpan={5} />
                <td className="py-2 px-3 text-right text-xs text-muted-foreground" colSpan={2}>
                  Subtotal
                </td>
                <td className="py-2 pr-5 text-right font-medium tabular-nums">
                  {formatINR(Number(po.subtotal))}
                </td>
              </tr>
              <tr className="bg-muted/30">
                <td colSpan={5} />
                <td className="py-1 px-3 text-right text-xs text-muted-foreground" colSpan={2}>
                  GST
                </td>
                <td className="py-1 pr-5 text-right font-medium tabular-nums">
                  {formatINR(Number(po.taxTotal))}
                </td>
              </tr>
              <tr className="bg-muted/30 text-base font-semibold">
                <td colSpan={5} />
                <td className="py-2 px-3 text-right" colSpan={2}>
                  Grand Total
                </td>
                <td className="py-2 pr-5 text-right tabular-nums">
                  {formatINR(Number(po.grandTotal))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Receive Goods Dialog */}
      {canReceive && (
        <ReceiveGoodsDialog
          orgId={oId}
          poId={pId}
          items={po.items ?? []}
          open={receiveOpen}
          onOpenChange={setReceiveOpen}
        />
      )}

      {/* Hidden print template */}
      {org && (
        <div style={{ position: "absolute", left: "-9999px", top: 0, zIndex: -1 }}>
          <PrintablePO ref={printRef} po={po} org={org} logoUrl={logoUrl} />
        </div>
      )}
    </div>
  )
}
