import { baseApi } from "@/services/baseApi"
import type {
  ApiResponse,
  AnalyticsSummary,
  RevenueMonth,
  GstSummaryData,
  TopCustomer,
  StatusBreakdown,
} from "@/types"

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnalyticsSummary: builder.query<ApiResponse<AnalyticsSummary>, number>({
      query: (orgId) => `/organizations/${orgId}/analytics/summary`,
      providesTags: (_result, _error, orgId) => [
        { type: "Invoice", id: orgId },
        { type: "Customer", id: orgId },
      ],
    }),

    getRevenueOverTime: builder.query<
      ApiResponse<RevenueMonth[]>,
      { orgId: number; months?: number }
    >({
      query: ({ orgId, months = 12 }) =>
        `/organizations/${orgId}/analytics/revenue-over-time?months=${months}`,
      providesTags: (_result, _error, { orgId }) => [
        { type: "Invoice", id: orgId },
      ],
    }),

    getGstSummary: builder.query<
      ApiResponse<GstSummaryData>,
      { orgId: number; from?: string; to?: string }
    >({
      query: ({ orgId, from, to }) => {
        const params = new URLSearchParams()
        if (from) params.set("from", from)
        if (to) params.set("to", to)
        const qs = params.toString()
        return `/organizations/${orgId}/analytics/gst-summary${qs ? `?${qs}` : ""}`
      },
      providesTags: (_result, _error, { orgId }) => [
        { type: "Invoice", id: orgId },
      ],
    }),

    getTopCustomers: builder.query<
      ApiResponse<TopCustomer[]>,
      { orgId: number; limit?: number }
    >({
      query: ({ orgId, limit = 10 }) =>
        `/organizations/${orgId}/analytics/top-customers?limit=${limit}`,
      providesTags: (_result, _error, { orgId }) => [
        { type: "Invoice", id: orgId },
      ],
    }),

    getStatusBreakdown: builder.query<
      ApiResponse<StatusBreakdown[]>,
      number
    >({
      query: (orgId) => `/organizations/${orgId}/analytics/status-breakdown`,
      providesTags: (_result, _error, orgId) => [
        { type: "Invoice", id: orgId },
      ],
    }),
  }),
})

export const {
  useGetAnalyticsSummaryQuery,
  useGetRevenueOverTimeQuery,
  useGetGstSummaryQuery,
  useGetTopCustomersQuery,
  useGetStatusBreakdownQuery,
} = analyticsApi
