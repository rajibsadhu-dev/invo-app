import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setToken, clearCredentials } from "@/features/auth/authSlice"
import { restoreSession } from "@/services/baseApi"

/**
 * Restores the in-memory access token on page load.
 *
 * The token is not persisted (see the store's persist whitelist), so after a reload a
 * returning user has a rehydrated profile but no token. Exchanging the httpOnly refresh
 * cookie here — once, before the routes mount — avoids every protected query racing to
 * refresh at the same time.
 */
export default function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false

    // Nothing to restore: either no prior session, or we already hold a token.
    if (!user || accessToken) {
      setChecked(true)
      return
    }

    restoreSession().then((token) => {
      if (cancelled) return
      if (token) {
        dispatch(setToken(token))
      } else {
        dispatch(clearCredentials())
      }
      setChecked(true)
    })

    return () => {
      cancelled = true
    }
    // Runs once on mount; later token changes are handled by baseApi's reauth path.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return <>{children}</>
}
