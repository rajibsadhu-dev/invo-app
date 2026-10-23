import { baseApi } from "@/services/baseApi"
import type {
  ApiResponse,
  PaginatedResponse,
  Supplier,
  SupplierPickerHit,
  CreateSupplierPayload,
  UpdateSupplierPayload,
} from "@/types"

export const supplierApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSuppliers: builder.query<
      PaginatedResponse<Supplier>,
      { orgId: number; search?: string; page?: number; limit?: number; filter?: string | string[] }
    >({
      query: ({ orgId, ...params }) => ({
        url: `/organizations/${orgId}/suppliers`,
        params,
      }),
      providesTags: (_result, _error, { orgId }) => [
        { type: "Supplier", id: orgId },
      ],
    }),

    getSupplierById: builder.query<
      ApiResponse<Supplier>,
      { orgId: number; supplierId: number }
    >({
      query: ({ orgId, supplierId }) =>
        `/organizations/${orgId}/suppliers/${supplierId}`,
      providesTags: (_result, _error, { supplierId }) => [
        { type: "Supplier", id: supplierId },
      ],
    }),

    searchSuppliers: builder.query<
      ApiResponse<SupplierPickerHit[]>,
      { orgId: number; q: string }
    >({
      query: ({ orgId, q }) => ({
        url: `/organizations/${orgId}/suppliers/search`,
        params: { q },
      }),
    }),

    createSupplier: builder.mutation<
      ApiResponse<Supplier>,
      { orgId: number; body: CreateSupplierPayload }
    >({
      query: ({ orgId, body }) => ({
        url: `/organizations/${orgId}/suppliers`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: "Supplier", id: orgId },
      ],
    }),

    updateSupplier: builder.mutation<
      ApiResponse<Supplier>,
      { orgId: number; supplierId: number; body: UpdateSupplierPayload }
    >({
      query: ({ orgId, supplierId, body }) => ({
        url: `/organizations/${orgId}/suppliers/${supplierId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId, supplierId }) => [
        { type: "Supplier", id: orgId },
        { type: "Supplier", id: supplierId },
      ],
    }),

    deleteSupplier: builder.mutation<
      ApiResponse<null>,
      { orgId: number; supplierId: number }
    >({
      query: ({ orgId, supplierId }) => ({
        url: `/organizations/${orgId}/suppliers/${supplierId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: "Supplier", id: orgId },
      ],
    }),
  }),
})

export const {
  useGetSuppliersQuery,
  useGetSupplierByIdQuery,
  useSearchSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = supplierApi
