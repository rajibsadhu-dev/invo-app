import { Navigate, useLocation } from "react-router-dom"
import { useAppSelector } from "@/store/hooks"

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, accessToken } = useAppSelector((s) => s.auth)
  const location = useLocation()

  if (!user || !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
