import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import type { RevenueMonth } from "@/types"

function formatMonth(ym: string) {
  const [y, m] = ym.split("-")
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[Number(m) - 1]} ${y.slice(2)}`
}

function formatTooltipValue(value: number) {
  return `₹${value.toLocaleString("en-IN")}`
}

export default function RevenueChart({ data }: { data: RevenueMonth[] }) {
  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    revenue: Number(d.revenue),
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          tickLine={false}
          axisLine={false}
          width={55}
        />
        <Tooltip
          formatter={(value) => [formatTooltipValue(Number(value)), "Revenue"]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid hsl(var(--border))",
            backgroundColor: "hsl(var(--card))",
            fontSize: 12,
          }}
        />
        <Bar
          dataKey="revenue"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
