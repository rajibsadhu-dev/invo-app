import { baseApi } from "@/services/baseApi"
import type { ApiResponse, CreateOrgPayload, OrganizationWithOwner } from "@/types"

export const adminOrgApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllOrganizations: builder.query<ApiResponse<OrganizationWithOwner[]>, string | void>({
      query: (search) => ({
        url: "/admin/organizations",
        params: search ? { search } : {},
      }),
      providesTags: ["Organization"],
    }),

    adminCreateOrganization: builder.mutation<ApiResponse<OrganizationWithOwner>, CreateOrgPayload>({
      query: (body) => ({ url: "/admin/organizations", method: "POST", body }),
      invalidatesTags: ["Organization"],
    }),

    assignOrganization: builder.mutation<
      ApiResponse<OrganizationWithOwner>,
      { orgId: number; userId: number }
    >({
      query: ({ orgId, userId }) => ({
        url: `/admin/organizations/${orgId}/assign`,
        method: "PATCH",
        body: { userId },
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        "Organization",
        { type: "Organization", id: orgId },
      ],
    }),
  }),
})

export const {
  useGetAllOrganizationsQuery,
  useAdminCreateOrganizationMutation,
  useAssignOrganizationMutation,
} = adminOrgApi
