import { useState } from "react"
import { useParams } from "react-router-dom"
import { FileText } from "lucide-react"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useGetGstSummaryQuery } from "@/features/analytics/analyticsApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import type { GstSlabRow } from "@/types"

function formatCurrency(value: string | number) {
  return `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function GstTable({ rows, title }: { rows: GstSlabRow[]; title: string }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
        <h3 className="font-heading text-sm font-semibold mb-3">{title}</h3>
        <p className="text-sm text-muted-foreground py-4 text-center">No data</p>
      </div>
    )
  }

  const totals = rows.reduce(
    (acc, r) => ({
      count: acc.count + r.count,
      taxableValue: acc.taxableValue + Number(r.taxableValue),
      cgst: acc.cgst + Number(r.cgst),
      sgst: acc.sgst + Number(r.sgst),
      igst: acc.igst + Number(r.igst),
    }),
    { count: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0 }
  )

  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
      <h3 className="font-heading text-sm font-semibold mb-3">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 font-medium">GST Rate</th>
              <th className="pb-2 font-medium text-right">Invoices</th>
              <th className="pb-2 font-medium text-right">Taxable Value</th>
              <th className="pb-2 font-medium text-right">CGST</th>
              <th className="pb-2 font-medium text-right">SGST</th>
              <th className="pb-2 font-medium text-right">IGST</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.gstRate} className="border-b">
                <td className="py-2 font-medium">{Number(r.gstRate)}%</td>
                <td className="py-2 text-right">{r.count}</td>
                <td className="py-2 text-right">{formatCurrency(r.taxableValue)}</td>
                <td className="py-2 text-right">{formatCurrency(r.cgst)}</td>
                <td className="py-2 text-right">{formatCurrency(r.sgst)}</td>
                <td className="py-2 text-right">{formatCurrency(r.igst)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-2">Total</td>
              <td className="py-2 text-right">{totals.count}</td>
              <td className="py-2 text-right">{formatCurrency(totals.taxableValue)}</td>
              <td className="py-2 text-right">{formatCurrency(totals.cgst)}</td>
              <td className="py-2 text-right">{formatCurrency(totals.sgst)}</td>
              <td className="py-2 text-right">{formatCurrency(totals.igst)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function GstSummaryPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const id = Number(orgId)

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Dashboard", to: `/org/${id}/dashboard` },
    { label: "GST Summary" },
  ])

  const now = new Date()
  const fyStart = now.getMonth() >= 3
    ? `${now.getFullYear()}-04-01`
    : `${now.getFullYear() - 1}-04-01`
  const fyEnd = now.getMonth() >= 3
    ? `${now.getFullYear() + 1}-03-31`
    : `${now.getFullYear()}-03-31`

  const [from, setFrom] = useState(fyStart)
  const [to, setTo] = useState(fyEnd)

  const { data: gstData, isLoading } = useGetGstSummaryQuery({ orgId: id, from, to })
  const gst = gstData?.data

  return (
    <div className="flex flex-col gap-4 max-w-5xl">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <h1 className="font-heading text-xl font-semibold">GST Summary</h1>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-9 rounded-md border bg-transparent px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-9 rounded-md border bg-transparent px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      )}

      {gst && (
        <div className="flex flex-col gap-4">
          <GstTable rows={gst.rows} title="All Invoices" />
          <GstTable rows={gst.intraState} title="Intra-State (CGST + SGST)" />
          <GstTable rows={gst.interState} title="Inter-State (IGST)" />
        </div>
      )}
    </div>
  )
}
