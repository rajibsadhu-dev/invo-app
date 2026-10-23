import { baseApi } from "@/services/baseApi"
import type {
  ApiResponse,
  VariantAttribute,
  CreateVariantAttributePayload,
  UpdateVariantAttributePayload,
} from "@/types"

export const variantAttributeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVariantAttributes: builder.query<ApiResponse<VariantAttribute[]>, { orgId: number }>({
      query: ({ orgId }) => `/organizations/${orgId}/variant-attributes`,
      providesTags: (_result, _error, { orgId }) => [{ type: "VariantAttribute", id: orgId }],
    }),

    createVariantAttribute: builder.mutation<
      ApiResponse<VariantAttribute>,
      { orgId: number; body: CreateVariantAttributePayload }
    >({
      query: ({ orgId, body }) => ({
        url: `/organizations/${orgId}/variant-attributes`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [{ type: "VariantAttribute", id: orgId }],
    }),

    updateVariantAttribute: builder.mutation<
      ApiResponse<VariantAttribute>,
      { orgId: number; attributeId: number; body: UpdateVariantAttributePayload }
    >({
      query: ({ orgId, attributeId, body }) => ({
        url: `/organizations/${orgId}/variant-attributes/${attributeId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [{ type: "VariantAttribute", id: orgId }],
    }),

    deleteVariantAttribute: builder.mutation<
      ApiResponse<null>,
      { orgId: number; attributeId: number }
    >({
      query: ({ orgId, attributeId }) => ({
        url: `/organizations/${orgId}/variant-attributes/${attributeId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { orgId }) => [{ type: "VariantAttribute", id: orgId }],
    }),
  }),
})

export const {
  useGetVariantAttributesQuery,
  useCreateVariantAttributeMutation,
  useUpdateVariantAttributeMutation,
  useDeleteVariantAttributeMutation,
} = variantAttributeApi
