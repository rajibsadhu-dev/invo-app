import { configureStore, combineReducers } from "@reduxjs/toolkit"
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist"
import storage from "redux-persist/lib/storage"
import authReducer from "@/features/auth/authSlice"
import { baseApi } from "@/services/baseApi"

const authPersistConfig = {
  key: "auth",
  storage,
  // Only the user profile is persisted, for instant UI hydration on reload.
  // The access token is deliberately NOT stored: localStorage is readable by any
  // script on the page, so persisting it hands a bearer token to any XSS. It lives in
  // memory only and is re-obtained from the httpOnly refresh cookie on boot.
  whitelist: ["user"],
}

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  [baseApi.reducerPath]: baseApi.reducer,
})

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
