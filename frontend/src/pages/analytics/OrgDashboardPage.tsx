import { useParams, Link } from "react-router-dom"
import { BarChart3, IndianRupee, Users, FileText, AlertTriangle, Package } from "lucide-react"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import {
  useGetAnalyticsSummaryQuery,
  useGetRevenueOverTimeQuery,
  useGetTopCustomersQuery,
  useGetStatusBreakdownQuery,
} from "@/features/analytics/analyticsApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import RevenueChart from "./RevenueChart"
import StatusChart from "./StatusChart"

function formatCurrency(value: string | number) {
  return `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string
  value: React.ReactNode
  icon: React.ElementType
  className?: string
}) {
  return (
    <div className={`rounded-xl bg-card p-5 ring-1 ring-foreground/10 ${className ?? ""}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4.5 w-4.5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold truncate">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function OrgDashboardPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const id = Number(orgId)

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Dashboard" },
  ])

  const { data: summaryData, isLoading: summaryLoading } = useGetAnalyticsSummaryQuery(id)
  const summary = summaryData?.data

  const { data: revenueData } = useGetRevenueOverTimeQuery({ orgId: id, months: 12 })
  const revenueMonths = revenueData?.data ?? []

  const { data: topCustomersData } = useGetTopCustomersQuery({ orgId: id, limit: 5 })
  const topCustomers = topCustomersData?.data ?? []

  const { data: statusData } = useGetStatusBreakdownQuery(id)
  const statusBreakdown = statusData?.data ?? []

  const totalInvoices = summary
    ? Object.values(summary.invoiceCountByStatus).reduce((a, b) => a + b, 0)
    : 0

  return (
    <div className="flex flex-col gap-4 max-w-5xl">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <h1 className="font-heading text-xl font-semibold">Dashboard</h1>
      </div>

      {summaryLoading && (
        <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
      )}

      {summary && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Total Revenue"
              value={formatCurrency(summary.totalRevenue)}
              icon={IndianRupee}
            />
            <StatCard
              label="This Month"
              value={formatCurrency(summary.thisMonthRevenue)}
              icon={IndianRupee}
            />
            <StatCard
              label="Outstanding"
              value={formatCurrency(summary.totalOutstanding)}
              icon={FileText}
              className={Number(summary.totalOutstanding) > 0 ? "ring-amber-500/30" : ""}
            />
            <StatCard
              label="Overdue"
              value={formatCurrency(summary.totalOverdue)}
              icon={AlertTriangle}
              className={Number(summary.totalOverdue) > 0 ? "ring-destructive/30" : ""}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Invoices"
              value={totalInvoices}
              icon={FileText}
            />
            <StatCard
              label="Customers"
              value={summary.totalCustomers}
              icon={Users}
            />
            <StatCard
              label="Products"
              value={summary.totalProducts}
              icon={Package}
            />
            <StatCard
              label="Low Stock"
              value={summary.lowStockCount}
              icon={AlertTriangle}
              className={summary.lowStockCount > 0 ? "ring-destructive/30" : ""}
            />
          </div>

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <h3 className="font-heading text-sm font-semibold mb-4">Revenue (Last 12 Months)</h3>
              {revenueMonths.length > 0 ? (
                <RevenueChart data={revenueMonths} />
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No revenue data yet</p>
              )}
            </div>

            <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
              <h3 className="font-heading text-sm font-semibold mb-4">Invoice Status</h3>
              {statusBreakdown.some((s) => s.count > 0) ? (
                <StatusChart data={statusBreakdown} />
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No invoices yet</p>
              )}
            </div>
          </div>

          {/* Top customers */}
          <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <h3 className="font-heading text-sm font-semibold mb-3">Top Customers by Revenue</h3>
            {topCustomers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Customer</th>
                      <th className="pb-2 font-medium text-right">Revenue</th>
                      <th className="pb-2 font-medium text-right">Invoices</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((c) => (
                      <tr key={c.customerId} className="border-b last:border-0">
                        <td className="py-2">{c.customerName}</td>
                        <td className="py-2 text-right font-medium">{formatCurrency(c.totalRevenue)}</td>
                        <td className="py-2 text-right text-muted-foreground">{c.invoiceCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No paid invoices yet</p>
            )}
          </div>
          {/* Quick links */}
          <div className="flex gap-3">
            <Link
              to={`/org/${id}/dashboard/gst`}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              <FileText className="h-4 w-4" /> GST Summary
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
