import { baseApi } from "@/services/baseApi"
import type {
  ApiResponse,
  PaginatedResponse,
  PurchaseOrder,
  CreatePOPayload,
  UpdatePOPayload,
  ReceivePOPayload,
} from "@/types"

export const purchaseOrderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPurchaseOrders: builder.query<
      PaginatedResponse<PurchaseOrder>,
      { orgId: number; search?: string; page?: number; limit?: number; filter?: string | string[] }
    >({
      query: ({ orgId, ...params }) => ({
        url: `/organizations/${orgId}/purchase-orders`,
        params,
      }),
      providesTags: (_result, _error, { orgId }) => [
        { type: "PurchaseOrder", id: orgId },
      ],
    }),

    getPurchaseOrderById: builder.query<
      ApiResponse<PurchaseOrder>,
      { orgId: number; poId: number }
    >({
      query: ({ orgId, poId }) =>
        `/organizations/${orgId}/purchase-orders/${poId}`,
      providesTags: (_result, _error, { poId }) => [
        { type: "PurchaseOrder", id: poId },
      ],
    }),

    createPurchaseOrder: builder.mutation<
      ApiResponse<PurchaseOrder>,
      { orgId: number; body: CreatePOPayload }
    >({
      query: ({ orgId, body }) => ({
        url: `/organizations/${orgId}/purchase-orders`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: "PurchaseOrder", id: orgId },
      ],
    }),

    updatePurchaseOrder: builder.mutation<
      ApiResponse<PurchaseOrder>,
      { orgId: number; poId: number; body: UpdatePOPayload }
    >({
      query: ({ orgId, poId, body }) => ({
        url: `/organizations/${orgId}/purchase-orders/${poId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId, poId }) => [
        { type: "PurchaseOrder", id: orgId },
        { type: "PurchaseOrder", id: poId },
        { type: "Inventory", id: orgId },
      ],
    }),

    deletePurchaseOrder: builder.mutation<
      ApiResponse<null>,
      { orgId: number; poId: number }
    >({
      query: ({ orgId, poId }) => ({
        url: `/organizations/${orgId}/purchase-orders/${poId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: "PurchaseOrder", id: orgId },
      ],
    }),

    receiveGoods: builder.mutation<
      ApiResponse<PurchaseOrder>,
      { orgId: number; poId: number; body: ReceivePOPayload }
    >({
      query: ({ orgId, poId, body }) => ({
        url: `/organizations/${orgId}/purchase-orders/${poId}/receive`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId, poId }) => [
        { type: "PurchaseOrder", id: orgId },
        { type: "PurchaseOrder", id: poId },
        { type: "StockMovement", id: orgId },
        { type: "Inventory", id: orgId },
        { type: "Product", id: orgId },
      ],
    }),
  }),
})

export const {
  useGetPurchaseOrdersQuery,
  useGetPurchaseOrderByIdQuery,
  useCreatePurchaseOrderMutation,
  useUpdatePurchaseOrderMutation,
  useDeletePurchaseOrderMutation,
  useReceiveGoodsMutation,
} = purchaseOrderApi
