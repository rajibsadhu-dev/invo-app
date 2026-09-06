import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react"
import type { RootState } from "@/store"
import { setToken, clearCredentials } from "@/features/auth/authSlice"

// Empty VITE_API_URL means "same origin as the page", which is the single-origin deploy.
const API_ROOT = `${import.meta.env.VITE_API_URL ?? ""}/api/v1`

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_ROOT,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken
    if (token) {
      headers.set("authorization", `Bearer ${token}`)
    }
    return headers
  },
  credentials: "include",
})

/**
 * Refresh tokens rotate server-side: presenting one consumes it. If two requests both
 * 401 and both call /auth/refresh-token, the second presents an already-consumed token,
 * which the server treats as a replay and responds to by revoking every session.
 *
 * So all callers share one in-flight refresh.
 */
let refreshInFlight: Promise<{ ok: boolean; accessToken?: string }> | null = null

const refreshAccessToken = (
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2]
) => {
  if (!refreshInFlight) {
    // rawBaseQuery is typed MaybePromise, so normalise before chaining.
    refreshInFlight = Promise.resolve(
      rawBaseQuery({ url: "/auth/refresh-token", method: "POST" }, api, extraOptions)
    )
      .then((result) => {
        const accessToken = (result.data as { data?: { accessToken?: string } })?.data
          ?.accessToken
        return accessToken ? { ok: true, accessToken } : { ok: false }
      })
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  const isRefreshCall =
    typeof args === "object" && args.url === "/auth/refresh-token"

  if (result.error?.status === 401 && !isRefreshCall) {
    const refreshed = await refreshAccessToken(api, extraOptions)

    if (refreshed?.ok && refreshed.accessToken) {
      api.dispatch(setToken(refreshed.accessToken))
      result = await rawBaseQuery(args, api, extraOptions)
    } else {
      api.dispatch(clearCredentials())
    }
  }

  return result
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["User", "Organization", "Customer", "Invoice"],
  endpoints: () => ({}),
})

/**
 * Boot-time session restore. The access token is no longer persisted to localStorage, so
 * after a reload the only proof of session is the httpOnly refresh cookie — exchange it
 * for a fresh access token before rendering the protected tree.
 *
 * Uses fetch directly because it runs before any RTK Query hook has mounted.
 */
export async function restoreSession(): Promise<string | null> {
  try {
    const res = await fetch(`${API_ROOT}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data?: { accessToken?: string } }
    return json?.data?.accessToken ?? null
  } catch {
    return null
  }
}

type MeUser = {
  id: number
  name: string
  email: string
  role: "superadmin" | "user"
  phone?: string | null
  emailVerifiedAt?: string | null
}

export async function fetchMe(accessToken: string): Promise<MeUser | null> {
  try {
    const res = await fetch(`${API_ROOT}/auth/me`, {
      headers: { authorization: `Bearer ${accessToken}` },
      credentials: "include",
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data?: MeUser }
    return json?.data ?? null
  } catch {
    return null
  }
}
