import { Navigate, useLocation } from "react-router-dom"
import { useAppSelector } from "@/store/hooks"

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useAppSelector((s) => s.auth.user)
  const location = useLocation()

  // Keyed on `user` alone: the access token is memory-only and is restored asynchronously
  // by AuthBootstrap, so requiring it here would redirect on every reload.
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
