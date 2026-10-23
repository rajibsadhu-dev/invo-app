import { baseApi } from "@/services/baseApi"
import type {
  ApiResponse,
  PaginatedResponse,
  Product,
  ProductPickerHit,
  CreateProductPayload,
  UpdateProductPayload,
} from "@/types"

export type ProductListParams = {
  orgId: number
  search?: string
  categoryId?: number
  /** Omit for every product; true/false to filter by active state. */
  isActive?: boolean
  page?: number
  limit?: number
  sort?: string
  filter?: string[]
}

function buildProductParams(params: Omit<ProductListParams, "orgId">) {
  const query: Record<string, string | string[]> = {}

  if (params.filter?.length) query.filter = params.filter
  if (params.search) query.search = params.search
  if (params.categoryId) query.categoryId = String(params.categoryId)
  if (params.isActive !== undefined) query.isActive = String(params.isActive)
  if (params.sort) query.sort = params.sort
  if (params.page) query.page = String(params.page)
  if (params.limit) query.limit = String(params.limit)

  return query
}

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<PaginatedResponse<Product>, ProductListParams>({
      query: ({ orgId, ...params }) => ({
        url: `/organizations/${orgId}/products`,
        params: buildProductParams(params),
      }),
      providesTags: (_result, _error, { orgId }) => [{ type: "Product", id: orgId }],
    }),

    /**
     * Picker lookup for the invoice form: active products only, ten at most, trimmed to
     * the fields a line item fills in.
     */
    searchProducts: builder.query<
      ApiResponse<ProductPickerHit[]>,
      { orgId: number; q: string }
    >({
      query: ({ orgId, q }) => ({
        url: `/organizations/${orgId}/products/search`,
        params: { q },
      }),
      providesTags: (_result, _error, { orgId }) => [{ type: "Product", id: orgId }],
    }),

    getProductById: builder.query<ApiResponse<Product>, { orgId: number; productId: number }>({
      query: ({ orgId, productId }) => `/organizations/${orgId}/products/${productId}`,
      providesTags: (_result, _error, { productId }) => [{ type: "Product", id: productId }],
    }),

    createProduct: builder.mutation<
      ApiResponse<Product>,
      { orgId: number; body: CreateProductPayload }
    >({
      query: ({ orgId, body }) => ({
        url: `/organizations/${orgId}/products`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [{ type: "Product", id: orgId }],
    }),

    updateProduct: builder.mutation<
      ApiResponse<Product>,
      { orgId: number; productId: number; body: UpdateProductPayload }
    >({
      query: ({ orgId, productId, body }) => ({
        url: `/organizations/${orgId}/products/${productId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId, productId }) => [
        { type: "Product", id: orgId },
        { type: "Product", id: productId },
      ],
    }),

    /** Deletes an unused product; deactivates one that already appears on invoices. */
    deleteProduct: builder.mutation<ApiResponse<null>, { orgId: number; productId: number }>({
      query: ({ orgId, productId }) => ({
        url: `/organizations/${orgId}/products/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { orgId, productId }) => [
        { type: "Product", id: orgId },
        { type: "Product", id: productId },
      ],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useSearchProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productApi
