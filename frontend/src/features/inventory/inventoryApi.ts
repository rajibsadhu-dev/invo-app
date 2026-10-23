import { baseApi } from "@/services/baseApi"
import type {
  ApiResponse,
  StockMovement,
  StockAdjustPayload,
  StockSetPayload,
  LowStockResult,
  InventorySummary,
} from "@/types"

type PaginatedResponse<T> = ApiResponse<T> & {
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export const inventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    adjustStock: builder.mutation<
      ApiResponse<StockMovement>,
      { orgId: number; productId: number; body: StockAdjustPayload }
    >({
      query: ({ orgId, productId, body }) => ({
        url: `/organizations/${orgId}/inventory/products/${productId}/stock-adjust`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId, productId }) => [
        { type: "StockMovement", id: productId },
        { type: "Product", id: productId },
        { type: "Product", id: orgId },
        { type: "Inventory", id: orgId },
      ],
    }),

    setStock: builder.mutation<
      ApiResponse<StockMovement>,
      { orgId: number; productId: number; body: StockSetPayload }
    >({
      query: ({ orgId, productId, body }) => ({
        url: `/organizations/${orgId}/inventory/products/${productId}/stock-set`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId, productId }) => [
        { type: "StockMovement", id: productId },
        { type: "Product", id: productId },
        { type: "Product", id: orgId },
        { type: "Inventory", id: orgId },
      ],
    }),

    getProductMovements: builder.query<
      PaginatedResponse<StockMovement[]>,
      { orgId: number; productId: number; page?: number; limit?: number; type?: string }
    >({
      query: ({ orgId, productId, ...params }) => ({
        url: `/organizations/${orgId}/inventory/products/${productId}/stock-movements`,
        params,
      }),
      providesTags: (_result, _error, { productId }) => [
        { type: "StockMovement", id: productId },
      ],
    }),

    getOrgMovements: builder.query<
      PaginatedResponse<StockMovement[]>,
      { orgId: number; page?: number; limit?: number; productId?: number; type?: string }
    >({
      query: ({ orgId, ...params }) => ({
        url: `/organizations/${orgId}/inventory/movements`,
        params,
      }),
      providesTags: (_result, _error, { orgId }) => [
        { type: "StockMovement", id: orgId },
      ],
    }),

    getLowStock: builder.query<
      ApiResponse<LowStockResult>,
      number
    >({
      query: (orgId) => `/organizations/${orgId}/inventory/low-stock`,
      providesTags: (_result, _error, orgId) => [
        { type: "Inventory", id: orgId },
      ],
    }),

    getInventorySummary: builder.query<
      ApiResponse<InventorySummary>,
      number
    >({
      query: (orgId) => `/organizations/${orgId}/inventory/summary`,
      providesTags: (_result, _error, orgId) => [
        { type: "Inventory", id: orgId },
      ],
    }),
  }),
})

export const {
  useAdjustStockMutation,
  useSetStockMutation,
  useGetProductMovementsQuery,
  useGetOrgMovementsQuery,
  useGetLowStockQuery,
  useGetInventorySummaryQuery,
} = inventoryApi
