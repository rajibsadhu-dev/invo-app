import { baseApi } from "@/services/baseApi"
import type {
  ApiResponse,
  ProductCategory,
  ProductCategoryNode,
  ProductCategoryDetail,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from "@/types"

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Flat list, ordered by sortOrder then name. */
    getCategories: builder.query<ApiResponse<ProductCategory[]>, { orgId: number }>({
      query: ({ orgId }) => `/organizations/${orgId}/categories`,
      providesTags: (_result, _error, { orgId }) => [{ type: "Category", id: orgId }],
    }),

    /** Same rows nested under their parents — what the management page renders. */
    getCategoryTree: builder.query<ApiResponse<ProductCategoryNode[]>, { orgId: number }>({
      query: ({ orgId }) => ({
        url: `/organizations/${orgId}/categories`,
        params: { tree: "true" },
      }),
      providesTags: (_result, _error, { orgId }) => [{ type: "Category", id: orgId }],
    }),

    getCategoryById: builder.query<
      ApiResponse<ProductCategoryDetail>,
      { orgId: number; categoryId: number }
    >({
      query: ({ orgId, categoryId }) => `/organizations/${orgId}/categories/${categoryId}`,
      providesTags: (_result, _error, { categoryId }) => [{ type: "Category", id: categoryId }],
    }),

    createCategory: builder.mutation<
      ApiResponse<ProductCategory>,
      { orgId: number; body: CreateCategoryPayload }
    >({
      query: ({ orgId, body }) => ({
        url: `/organizations/${orgId}/categories`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [{ type: "Category", id: orgId }],
    }),

    updateCategory: builder.mutation<
      ApiResponse<ProductCategory>,
      { orgId: number; categoryId: number; body: UpdateCategoryPayload }
    >({
      query: ({ orgId, categoryId, body }) => ({
        url: `/organizations/${orgId}/categories/${categoryId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId, categoryId }) => [
        { type: "Category", id: orgId },
        { type: "Category", id: categoryId },
      ],
    }),

    deleteCategory: builder.mutation<ApiResponse<null>, { orgId: number; categoryId: number }>({
      query: ({ orgId, categoryId }) => ({
        url: `/organizations/${orgId}/categories/${categoryId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { orgId }) => [{ type: "Category", id: orgId }],
    }),
  }),
})

export const {
  useGetCategoriesQuery,
  useGetCategoryTreeQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi
