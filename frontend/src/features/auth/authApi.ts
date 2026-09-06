import { baseApi } from "@/services/baseApi"
import type {
  ApiResponse,
  LoginPayload,
  LoginData,
  User,
  UpdateMePayload,
  ChangePasswordPayload,
} from "@/types"

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<LoginData>, LoginPayload>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
    }),
    logout: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
    getMe: builder.query<ApiResponse<User>, void>({
      query: () => "/auth/me",
      providesTags: ["User"],
    }),
    // Self-service. The superadmin-only /users routes 403 for a regular user, which is
    // why editing your own profile used to fail outright.
    updateMe: builder.mutation<ApiResponse<User>, UpdateMePayload>({
      query: (body) => ({ url: "/auth/me", method: "PATCH", body }),
      invalidatesTags: ["User"],
    }),
    changePassword: builder.mutation<ApiResponse<null>, ChangePasswordPayload>({
      query: (body) => ({ url: "/auth/change-password", method: "POST", body }),
    }),
  }),
})

export const {
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
} = authApi
