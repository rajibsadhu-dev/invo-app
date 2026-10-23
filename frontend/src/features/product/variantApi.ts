import { baseApi } from "@/services/baseApi"
import type {
  ApiResponse,
  ProductVariant,
  CreateVariantPayload,
  UpdateVariantPayload,
  BulkGenerateVariantsPayload,
  BulkGenerateResult,
} from "@/types"

export const variantApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getVariants: builder.query<
      ApiResponse<ProductVariant[]>,
      { orgId: number; productId: number }
    >({
      query: ({ orgId, productId }) =>
        `/organizations/${orgId}/products/${productId}/variants`,
      providesTags: (_result, _error, { productId }) => [
        { type: "ProductVariant", id: productId },
      ],
    }),

    getVariantById: builder.query<
      ApiResponse<ProductVariant>,
      { orgId: number; productId: number; variantId: number }
    >({
      query: ({ orgId, productId, variantId }) =>
        `/organizations/${orgId}/products/${productId}/variants/${variantId}`,
      providesTags: (_result, _error, { variantId }) => [
        { type: "ProductVariant", id: variantId },
      ],
    }),

    createVariant: builder.mutation<
      ApiResponse<ProductVariant>,
      { orgId: number; productId: number; body: CreateVariantPayload }
    >({
      query: ({ orgId, productId, body }) => ({
        url: `/organizations/${orgId}/products/${productId}/variants`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { productId, orgId }) => [
        { type: "ProductVariant", id: productId },
        { type: "Product", id: orgId },
        { type: "Product", id: productId },
      ],
    }),

    updateVariant: builder.mutation<
      ApiResponse<ProductVariant>,
      { orgId: number; productId: number; variantId: number; body: UpdateVariantPayload }
    >({
      query: ({ orgId, productId, variantId, body }) => ({
        url: `/organizations/${orgId}/products/${productId}/variants/${variantId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { productId, orgId }) => [
        { type: "ProductVariant", id: productId },
        { type: "Product", id: orgId },
        { type: "Product", id: productId },
      ],
    }),

    deleteVariant: builder.mutation<
      ApiResponse<null>,
      { orgId: number; productId: number; variantId: number }
    >({
      query: ({ orgId, productId, variantId }) => ({
        url: `/organizations/${orgId}/products/${productId}/variants/${variantId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { productId, orgId }) => [
        { type: "ProductVariant", id: productId },
        { type: "Product", id: orgId },
        { type: "Product", id: productId },
      ],
    }),

    bulkGenerateVariants: builder.mutation<
      ApiResponse<BulkGenerateResult>,
      { orgId: number; productId: number; body: BulkGenerateVariantsPayload }
    >({
      query: ({ orgId, productId, body }) => ({
        url: `/organizations/${orgId}/products/${productId}/variants/generate`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { productId, orgId }) => [
        { type: "ProductVariant", id: productId },
        { type: "Product", id: orgId },
        { type: "Product", id: productId },
      ],
    }),
  }),
})

export const {
  useGetVariantsQuery,
  useGetVariantByIdQuery,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
  useBulkGenerateVariantsMutation,
} = variantApi
