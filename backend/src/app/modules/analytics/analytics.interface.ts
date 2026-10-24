export interface ISummary {
  totalRevenue: string;
  thisMonthRevenue: string;
  totalOutstanding: string;
  totalOverdue: string;
  invoiceCountByStatus: Record<string, number>;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
}

export interface IRevenueMonth {
  month: string;
  revenue: string;
}

export interface IGstSlabRow {
  gstRate: string;
  count: number;
  taxableValue: string;
  cgst: string;
  sgst: string;
  igst: string;
}

export interface ITopCustomer {
  customerId: number;
  customerName: string;
  totalRevenue: string;
  invoiceCount: number;
}

export interface IStatusBreakdown {
  status: string;
  count: number;
  totalAmount: string;
}
