import { baseApi } from "@/services/baseApi"
import type {
  ApiResponse,
  PaginatedResponse,
  Invoice,
  InvoiceStatus,
  CreateInvoicePayload,
  UpdateInvoicePayload,
} from "@/types"

export type InvoiceListParams = {
  orgId: number
  status?: InvoiceStatus
  customerId?: number
  search?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
  sort?: string
  filter?: string[]
}

function buildInvoiceParams(params: Omit<InvoiceListParams, "orgId">) {
  const query: Record<string, string | string[]> = {}

  const filters: string[] = [...(params.filter ?? [])]
  if (params.status) filters.push(`status = '${params.status}'`)
  if (params.customerId) filters.push(`customerId = ${params.customerId}`)
  if (params.fromDate) filters.push(`invoiceDate >= '${params.fromDate}'`)
  if (params.toDate) filters.push(`invoiceDate <= '${params.toDate}'`)

  if (filters.length) query.filter = filters
  if (params.search) query.search = params.search
  if (params.sort) query.sort = params.sort
  if (params.page) query.page = String(params.page)
  if (params.limit) query.limit = String(params.limit)

  return query
}

export const invoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvoices: builder.query<PaginatedResponse<Invoice>, InvoiceListParams>({
      query: ({ orgId, ...params }) => ({
        url: `/organizations/${orgId}/invoices`,
        params: buildInvoiceParams(params),
      }),
      providesTags: (_result, _error, { orgId }) => [{ type: "Invoice", id: orgId }],
    }),

    getInvoiceById: builder.query<ApiResponse<Invoice>, { orgId: number; invoiceId: number }>({
      query: ({ orgId, invoiceId }) => `/organizations/${orgId}/invoices/${invoiceId}`,
      providesTags: (_result, _error, { invoiceId }) => [{ type: "Invoice", id: invoiceId }],
    }),

    createInvoice: builder.mutation<ApiResponse<Invoice>, { orgId: number; body: CreateInvoicePayload }>({
      query: ({ orgId, body }) => ({
        url: `/organizations/${orgId}/invoices`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: "Invoice", id: orgId },
        { type: "Organization", id: orgId },
      ],
    }),

    updateInvoice: builder.mutation<
      ApiResponse<Invoice>,
      { orgId: number; invoiceId: number; body: UpdateInvoicePayload }
    >({
      query: ({ orgId, invoiceId, body }) => ({
        url: `/organizations/${orgId}/invoices/${invoiceId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId, invoiceId }) => [
        { type: "Invoice", id: orgId },
        { type: "Invoice", id: invoiceId },
      ],
    }),

    deleteInvoice: builder.mutation<ApiResponse<null>, { orgId: number; invoiceId: number }>({
      query: ({ orgId, invoiceId }) => ({
        url: `/organizations/${orgId}/invoices/${invoiceId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { orgId }) => [{ type: "Invoice", id: orgId }],
    }),
  }),
})

export const {
  useGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
} = invoiceApi
