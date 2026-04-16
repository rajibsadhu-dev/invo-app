import { baseApi } from "@/services/baseApi"
import type {
  ApiResponse,
  Organization,
  CreateOrgPayload,
  UpdateOrgPayload,
} from "@/types"

export const orgApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyOrganizations: builder.query<ApiResponse<Organization[]>, void>({
      query: () => "/organizations",
      providesTags: ["Organization"],
    }),

    getOrganizationById: builder.query<ApiResponse<Organization>, number>({
      query: (id) => `/organizations/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Organization", id }],
    }),

    createOrganization: builder.mutation<ApiResponse<Organization>, CreateOrgPayload>({
      query: (body) => ({ url: "/organizations", method: "POST", body }),
      invalidatesTags: ["Organization"],
    }),

    updateOrganization: builder.mutation<
      ApiResponse<Organization>,
      { id: number; body: UpdateOrgPayload }
    >({
      query: ({ id, body }) => ({
        url: `/organizations/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Organization",
        { type: "Organization", id },
      ],
    }),

    deleteOrganization: builder.mutation<ApiResponse<null>, number>({
      query: (id) => ({ url: `/organizations/${id}`, method: "DELETE" }),
      invalidatesTags: ["Organization"],
    }),

    uploadOrgLogo: builder.mutation<ApiResponse<Organization>, { id: number; file: File }>({
      query: ({ id, file }) => {
        const formData = new FormData()
        formData.append("logo", file)
        return { url: `/organizations/${id}/logo`, method: "POST", body: formData }
      },
      invalidatesTags: (_result, _error, { id }) => [
        "Organization",
        { type: "Organization", id },
      ],
    }),
  }),
})

export const {
  useGetMyOrganizationsQuery,
  useGetOrganizationByIdQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useUploadOrgLogoMutation,
} = orgApi
