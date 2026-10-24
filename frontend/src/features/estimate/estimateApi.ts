import { baseApi } from "@/services/baseApi"
import type {
  ApiResponse,
  PaginatedResponse,
  Estimate,
  EstimateStatus,
  CreateEstimatePayload,
  UpdateEstimatePayload,
  Invoice,
} from "@/types"

export type EstimateListParams = {
  orgId: number
  status?: EstimateStatus
  customerId?: number
  search?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
  sort?: string
  filter?: string[]
}

function buildEstimateParams(params: Omit<EstimateListParams, "orgId">) {
  const query: Record<string, string | string[]> = {}

  const filters: string[] = [...(params.filter ?? [])]
  if (params.status) filters.push(`status = '${params.status}'`)
  if (params.customerId) filters.push(`customerId = ${params.customerId}`)
  if (params.fromDate) filters.push(`estimateDate >= '${params.fromDate}'`)
  if (params.toDate) filters.push(`estimateDate <= '${params.toDate}'`)

  if (filters.length) query.filter = filters
  if (params.search) query.search = params.search
  if (params.sort) query.sort = params.sort
  if (params.page) query.page = String(params.page)
  if (params.limit) query.limit = String(params.limit)

  return query
}

export const estimateApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEstimates: builder.query<PaginatedResponse<Estimate>, EstimateListParams>({
      query: ({ orgId, ...params }) => ({
        url: `/organizations/${orgId}/estimates`,
        params: buildEstimateParams(params),
      }),
      providesTags: (_result, _error, { orgId }) => [{ type: "Estimate", id: orgId }],
    }),

    getEstimateById: builder.query<ApiResponse<Estimate>, { orgId: number; estimateId: number }>({
      query: ({ orgId, estimateId }) => `/organizations/${orgId}/estimates/${estimateId}`,
      providesTags: (_result, _error, { estimateId }) => [{ type: "Estimate", id: estimateId }],
    }),

    createEstimate: builder.mutation<ApiResponse<Estimate>, { orgId: number; body: CreateEstimatePayload }>({
      query: ({ orgId, body }) => ({
        url: `/organizations/${orgId}/estimates`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: "Estimate", id: orgId },
        { type: "Organization", id: orgId },
      ],
    }),

    updateEstimate: builder.mutation<
      ApiResponse<Estimate>,
      { orgId: number; estimateId: number; body: UpdateEstimatePayload }
    >({
      query: ({ orgId, estimateId, body }) => ({
        url: `/organizations/${orgId}/estimates/${estimateId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId, estimateId }) => [
        { type: "Estimate", id: orgId },
        { type: "Estimate", id: estimateId },
      ],
    }),

    deleteEstimate: builder.mutation<ApiResponse<null>, { orgId: number; estimateId: number }>({
      query: ({ orgId, estimateId }) => ({
        url: `/organizations/${orgId}/estimates/${estimateId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { orgId }) => [{ type: "Estimate", id: orgId }],
    }),

    sendEstimate: builder.mutation<
      ApiResponse<Estimate>,
      { orgId: number; estimateId: number; body: { to: string; subject: string; message: string } }
    >({
      query: ({ orgId, estimateId, body }) => ({
        url: `/organizations/${orgId}/estimates/${estimateId}/send`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId, estimateId }) => [
        { type: "Estimate", id: orgId },
        { type: "Estimate", id: estimateId },
      ],
    }),

    convertToInvoice: builder.mutation<
      ApiResponse<{ estimate: Estimate; invoice: Invoice }>,
      { orgId: number; estimateId: number }
    >({
      query: ({ orgId, estimateId }) => ({
        url: `/organizations/${orgId}/estimates/${estimateId}/convert`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { orgId, estimateId }) => [
        { type: "Estimate", id: orgId },
        { type: "Estimate", id: estimateId },
        { type: "Invoice", id: orgId },
        { type: "Organization", id: orgId },
      ],
    }),

    updateEstimateStatus: builder.mutation<
      ApiResponse<Estimate>,
      { orgId: number; estimateId: number; status: EstimateStatus }
    >({
      query: ({ orgId, estimateId, status }) => ({
        url: `/organizations/${orgId}/estimates/${estimateId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (_result, _error, { orgId, estimateId }) => [
        { type: "Estimate", id: orgId },
        { type: "Estimate", id: estimateId },
      ],
    }),
  }),
})

export const {
  useGetEstimatesQuery,
  useGetEstimateByIdQuery,
  useCreateEstimateMutation,
  useUpdateEstimateMutation,
  useDeleteEstimateMutation,
  useSendEstimateMutation,
  useConvertToInvoiceMutation,
  useUpdateEstimateStatusMutation,
} = estimateApi
