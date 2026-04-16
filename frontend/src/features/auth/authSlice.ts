import { createSlice } from "@reduxjs/toolkit"
import type { PayloadAction } from "@reduxjs/toolkit"
import type { UserRole } from "@/types"

type AuthUser = {
  id: number
  name: string
  email: string
  role: UserRole
  phone?: string | null
}

type AuthState = {
  user: AuthUser | null
  accessToken: string | null
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string }>
    ) {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
    },
    setToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload
    },
    clearCredentials(state) {
      state.user = null
      state.accessToken = null
    },
  },
})

export const { setCredentials, setToken, clearCredentials } = authSlice.actions
export default authSlice.reducer
