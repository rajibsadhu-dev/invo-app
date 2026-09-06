import { baseApi } from "@/services/baseApi"
import type {
  ApiResponse,
  PaginatedResponse,
  Customer,
  CreateCustomerPayload,
  UpdateCustomerPayload,
} from "@/types"

export type CustomerListParams = {
  orgId: number
  search?: string
  page?: number
  limit?: number
  sort?: string
  filter?: string[]
}

function buildCustomerParams(params: Omit<CustomerListParams, "orgId">) {
  const query: Record<string, string | string[]> = {}

  if (params.filter?.length) query.filter = params.filter
  if (params.search) query.search = params.search
  if (params.sort) query.sort = params.sort
  if (params.page) query.page = String(params.page)
  if (params.limit) query.limit = String(params.limit)

  return query
}

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<PaginatedResponse<Customer>, CustomerListParams>({
      query: ({ orgId, ...params }) => ({
        url: `/organizations/${orgId}/customers`,
        params: buildCustomerParams(params),
      }),
      providesTags: (_result, _error, { orgId }) => [{ type: "Customer", id: orgId }],
    }),

    getCustomerById: builder.query<ApiResponse<Customer>, { orgId: number; customerId: number }>({
      query: ({ orgId, customerId }) => `/organizations/${orgId}/customers/${customerId}`,
      providesTags: (_result, _error, { customerId }) => [{ type: "Customer", id: customerId }],
    }),

    createCustomer: builder.mutation<ApiResponse<Customer>, { orgId: number; body: CreateCustomerPayload }>({
      query: ({ orgId, body }) => ({
        url: `/organizations/${orgId}/customers`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [{ type: "Customer", id: orgId }],
    }),

    updateCustomer: builder.mutation<
      ApiResponse<Customer>,
      { orgId: number; customerId: number; body: UpdateCustomerPayload }
    >({
      query: ({ orgId, customerId, body }) => ({
        url: `/organizations/${orgId}/customers/${customerId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId, customerId }) => [
        { type: "Customer", id: orgId },
        { type: "Customer", id: customerId },
      ],
    }),

    deleteCustomer: builder.mutation<ApiResponse<null>, { orgId: number; customerId: number }>({
      query: ({ orgId, customerId }) => ({
        url: `/organizations/${orgId}/customers/${customerId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { orgId }) => [{ type: "Customer", id: orgId }],
    }),
  }),
})

export const {
  useGetCustomersQuery,
  useGetCustomerByIdQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customerApi
