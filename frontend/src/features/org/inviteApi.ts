import { baseApi } from "@/services/baseApi"
import type { ApiResponse, OrgInvite, OrgRole, InviteInfo } from "@/types"

export const inviteApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInvites: builder.query<ApiResponse<OrgInvite[]>, number>({
      query: (orgId) => `/organizations/${orgId}/invites`,
      providesTags: (_result, _error, orgId) => [
        { type: "Organization", id: `${orgId}-invites` },
      ],
    }),

    createInvite: builder.mutation<
      ApiResponse<OrgInvite>,
      { orgId: number; email: string; role: OrgRole }
    >({
      query: ({ orgId, ...body }) => ({
        url: `/organizations/${orgId}/invites`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: "Organization", id: `${orgId}-invites` },
      ],
    }),

    revokeInvite: builder.mutation<
      ApiResponse<null>,
      { orgId: number; inviteId: number }
    >({
      query: ({ orgId, inviteId }) => ({
        url: `/organizations/${orgId}/invites/${inviteId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { orgId }) => [
        { type: "Organization", id: `${orgId}-invites` },
      ],
    }),

    getInviteInfo: builder.query<ApiResponse<InviteInfo>, string>({
      query: (token) => `/auth/invite-info?token=${encodeURIComponent(token)}`,
    }),

    acceptInvite: builder.mutation<
      ApiResponse<{ id: number; name: string }>,
      string
    >({
      query: (token) => ({
        url: "/auth/accept-invite",
        method: "POST",
        body: { token },
      }),
      invalidatesTags: ["Organization"],
    }),
  }),
})

export const {
  useGetInvitesQuery,
  useCreateInviteMutation,
  useRevokeInviteMutation,
  useGetInviteInfoQuery,
  useAcceptInviteMutation,
} = inviteApi
