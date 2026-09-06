import { baseApi } from "@/services/baseApi"
import type {
  ApiResponse,
  RegisterPayload,
  LoginPayload,
  LoginData,
  User,
  UpdateMePayload,
  ChangePasswordPayload,
} from "@/types"

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<ApiResponse<LoginData>, RegisterPayload>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
    }),
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
    verifyEmail: builder.mutation<ApiResponse<null>, string>({
      query: (token) => ({
        url: `/auth/verify-email?token=${encodeURIComponent(token)}`,
        method: "GET",
      }),
      invalidatesTags: ["User"],
    }),
    resendVerification: builder.mutation<ApiResponse<null>, void>({
      query: () => ({ url: "/auth/resend-verification", method: "POST" }),
    }),
    forgotPassword: builder.mutation<ApiResponse<null>, { email: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
    resetPassword: builder.mutation<
      ApiResponse<null>,
      { token: string; newPassword: string }
    >({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
    }),
  }),
})

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useVerifyEmailMutation,
  useResendVerificationMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi
