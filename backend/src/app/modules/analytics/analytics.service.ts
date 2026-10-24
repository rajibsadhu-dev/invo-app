import { Prisma, InvoiceStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import type {
  ISummary,
  IRevenueMonth,
  IGstSlabRow,
  ITopCustomer,
  IStatusBreakdown,
} from "./analytics.interface";

const dec = (v: unknown): Prisma.Decimal =>
  v instanceof Prisma.Decimal ? v : new Prisma.Decimal(String(v));

const money = (d: Prisma.Decimal): string => d.toFixed(2);

const notDeleted = { deletedAt: null };

// ─── Summary ──────────────────────────────────────────────────────────────────

const getSummary = async (organizationId: number): Promise<ISummary> => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalRevenueAgg,
    thisMonthRevenueAgg,
    outstandingAgg,
    overdueAgg,
    statusCounts,
    totalCustomers,
    totalProducts,
    lowStockProducts,
    lowStockVariants,
  ] = await Promise.all([
    // Total revenue — paid invoices
    prisma.invoice.aggregate({
      where: { organizationId, status: "paid", ...notDeleted },
      _sum: { grandTotal: true },
    }),
    // This month's revenue
    prisma.invoice.aggregate({
      where: {
        organizationId,
        status: "paid",
        ...notDeleted,
        invoiceDate: { gte: monthStart },
      },
      _sum: { grandTotal: true },
    }),
    // Outstanding — sent invoices, balance due
    prisma.invoice.aggregate({
      where: { organizationId, status: "sent", ...notDeleted },
      _sum: { grandTotal: true, receivedAmount: true },
    }),
    // Overdue — sent invoices older than 30 days
    prisma.invoice.aggregate({
      where: {
        organizationId,
        status: "sent",
        ...notDeleted,
        invoiceDate: { lt: thirtyDaysAgo },
      },
      _sum: { grandTotal: true, receivedAmount: true },
    }),
    // Invoice counts by status
    prisma.invoice.groupBy({
      by: ["status"],
      where: { organizationId, ...notDeleted },
      _count: true,
    }),
    // Total customers
    prisma.customer.count({ where: { organizationId } }),
    // Total active products
    prisma.product.count({ where: { organizationId, isActive: true } }),
    // Low stock products (non-variant)
    prisma.$queryRaw<Array<{ cnt: bigint }>>`
      SELECT COUNT(*) AS cnt FROM products
      WHERE organization_id = ${organizationId}
        AND is_active = 1 AND has_variants = 0
        AND low_stock_alert IS NOT NULL
        AND stock_quantity <= low_stock_alert
    `,
    // Low stock variants
    prisma.$queryRaw<Array<{ cnt: bigint }>>`
      SELECT COUNT(*) AS cnt FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE p.organization_id = ${organizationId}
        AND p.is_active = 1 AND pv.is_active = 1
        AND pv.low_stock_alert IS NOT NULL
        AND pv.stock_quantity <= pv.low_stock_alert
    `,
  ]);

  const outstandingTotal = dec(outstandingAgg._sum.grandTotal ?? 0).minus(
    dec(outstandingAgg._sum.receivedAmount ?? 0)
  );

  const overdueTotal = dec(overdueAgg._sum.grandTotal ?? 0).minus(
    dec(overdueAgg._sum.receivedAmount ?? 0)
  );

  const invoiceCountByStatus: Record<string, number> = {};
  for (const s of statusCounts) {
    invoiceCountByStatus[s.status] = s._count;
  }

  return {
    totalRevenue: money(dec(totalRevenueAgg._sum.grandTotal ?? 0)),
    thisMonthRevenue: money(dec(thisMonthRevenueAgg._sum.grandTotal ?? 0)),
    totalOutstanding: money(outstandingTotal),
    totalOverdue: money(overdueTotal),
    invoiceCountByStatus,
    totalCustomers,
    totalProducts,
    lowStockCount:
      Number(lowStockProducts[0]?.cnt ?? 0) +
      Number(lowStockVariants[0]?.cnt ?? 0),
  };
};

// ─── Revenue over time ────────────────────────────────────────────────────────

const getRevenueOverTime = async (
  organizationId: number,
  months: number
): Promise<IRevenueMonth[]> => {
  const rows = await prisma.$queryRaw<
    Array<{ month: string; revenue: string }>
  >`
    SELECT
      DATE_FORMAT(invoice_date, '%Y-%m') AS month,
      COALESCE(SUM(grand_total), 0) AS revenue
    FROM invoices
    WHERE organization_id = ${organizationId}
      AND status = 'paid'
      AND deleted_at IS NULL
      AND invoice_date >= DATE_SUB(CURDATE(), INTERVAL ${months} MONTH)
    GROUP BY DATE_FORMAT(invoice_date, '%Y-%m')
    ORDER BY month ASC
  `;

  return rows.map((r) => ({
    month: r.month,
    revenue: money(dec(r.revenue)),
  }));
};

// ─── GST summary ─────────────────────────────────────────────────────────────

const getGstSummary = async (
  organizationId: number,
  from?: string,
  to?: string
): Promise<{ rows: IGstSlabRow[]; intraState: IGstSlabRow[]; interState: IGstSlabRow[] }> => {
  const dateFilter: Prisma.InvoiceWhereInput = {};
  if (from) dateFilter.invoiceDate = { ...dateFilter.invoiceDate as object, gte: new Date(from) };
  if (to) dateFilter.invoiceDate = { ...dateFilter.invoiceDate as object, lte: new Date(to + "T23:59:59.999Z") };

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { in: ["sent", "paid"] },
      ...notDeleted,
      ...dateFilter,
    },
    select: {
      id: true,
      isIntraState: true,
      items: {
        select: {
          gstRate: true,
          taxableValue: true,
          cgst: true,
          sgst: true,
          igst: true,
        },
      },
    },
  });

  const slabMap = new Map<string, { count: Set<number>; taxableValue: Prisma.Decimal; cgst: Prisma.Decimal; sgst: Prisma.Decimal; igst: Prisma.Decimal }>();
  const intraMap = new Map<string, { count: Set<number>; taxableValue: Prisma.Decimal; cgst: Prisma.Decimal; sgst: Prisma.Decimal; igst: Prisma.Decimal }>();
  const interMap = new Map<string, { count: Set<number>; taxableValue: Prisma.Decimal; cgst: Prisma.Decimal; sgst: Prisma.Decimal; igst: Prisma.Decimal }>();

  const zero = () => new Prisma.Decimal(0);
  const ensure = (map: typeof slabMap, key: string) => {
    if (!map.has(key)) {
      map.set(key, { count: new Set(), taxableValue: zero(), cgst: zero(), sgst: zero(), igst: zero() });
    }
    return map.get(key)!;
  };

  for (const inv of invoices) {
    const targetMap = inv.isIntraState ? intraMap : interMap;
    for (const item of inv.items) {
      const key = dec(item.gstRate).toFixed(2);

      const all = ensure(slabMap, key);
      all.count.add(inv.id);
      all.taxableValue = all.taxableValue.plus(dec(item.taxableValue));
      all.cgst = all.cgst.plus(dec(item.cgst));
      all.sgst = all.sgst.plus(dec(item.sgst));
      all.igst = all.igst.plus(dec(item.igst));

      const split = ensure(targetMap, key);
      split.count.add(inv.id);
      split.taxableValue = split.taxableValue.plus(dec(item.taxableValue));
      split.cgst = split.cgst.plus(dec(item.cgst));
      split.sgst = split.sgst.plus(dec(item.sgst));
      split.igst = split.igst.plus(dec(item.igst));
    }
  }

  const toRows = (map: typeof slabMap): IGstSlabRow[] =>
    Array.from(map.entries())
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([rate, d]) => ({
        gstRate: rate,
        count: d.count.size,
        taxableValue: money(d.taxableValue),
        cgst: money(d.cgst),
        sgst: money(d.sgst),
        igst: money(d.igst),
      }));

  return {
    rows: toRows(slabMap),
    intraState: toRows(intraMap),
    interState: toRows(interMap),
  };
};

// ─── Top customers ────────────────────────────────────────────────────────────

const getTopCustomers = async (
  organizationId: number,
  limit: number
): Promise<ITopCustomer[]> => {
  const rows = await prisma.$queryRaw<
    Array<{
      customer_id: number;
      customerName: string;
      totalRevenue: string;
      invoiceCount: bigint;
    }>
  >`
    SELECT
      i.customer_id,
      c.name AS customerName,
      COALESCE(SUM(i.grand_total), 0) AS totalRevenue,
      COUNT(*) AS invoiceCount
    FROM invoices i
    JOIN customers c ON c.id = i.customer_id
    WHERE i.organization_id = ${organizationId}
      AND i.status = 'paid'
      AND i.deleted_at IS NULL
    GROUP BY i.customer_id, c.name
    ORDER BY totalRevenue DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    customerId: r.customer_id,
    customerName: r.customerName,
    totalRevenue: money(dec(r.totalRevenue)),
    invoiceCount: Number(r.invoiceCount),
  }));
};

// ─── Status breakdown ─────────────────────────────────────────────────────────

const getStatusBreakdown = async (
  organizationId: number
): Promise<IStatusBreakdown[]> => {
  const rows = await prisma.invoice.groupBy({
    by: ["status"],
    where: { organizationId, ...notDeleted },
    _count: true,
    _sum: { grandTotal: true },
  });

  const allStatuses: InvoiceStatus[] = ["draft", "sent", "paid", "cancelled"];

  return allStatuses.map((status) => {
    const row = rows.find((r) => r.status === status);
    return {
      status,
      count: row?._count ?? 0,
      totalAmount: money(dec(row?._sum.grandTotal ?? 0)),
    };
  });
};

export const AnalyticsService = {
  getSummary,
  getRevenueOverTime,
  getGstSummary,
  getTopCustomers,
  getStatusBreakdown,
};
