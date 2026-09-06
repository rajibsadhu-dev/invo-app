import { baseApi } from "@/services/baseApi"
import type { ApiResponse, OrgMember, OrgRole } from "@/types"

export const teamApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getTeamMembers: builder.query<ApiResponse<OrgMember[]>, number>({
      query: (orgId) => `/organizations/${orgId}/team`,
      providesTags: (_result, _error, orgId) => [{ type: "Organization", id: `${orgId}-team` }],
    }),

    updateMemberRole: builder.mutation<
      ApiResponse<OrgMember>,
      { orgId: number; memberId: number; role: OrgRole }
    >({
      query: ({ orgId, memberId, role }) => ({
        url: `/organizations/${orgId}/team/${memberId}`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: "Organization", id: `${orgId}-team` },
      ],
    }),

    removeMember: builder.mutation<ApiResponse<null>, { orgId: number; memberId: number }>({
      query: ({ orgId, memberId }) => ({
        url: `/organizations/${orgId}/team/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: "Organization", id: `${orgId}-team` },
      ],
    }),
  }),
})

export const {
  useGetTeamMembersQuery,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
} = teamApi
