import { Navigate } from "react-router-dom"
import { useAppSelector } from "@/store/hooks"

export default function SuperadminRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useAppSelector((s) => s.auth.user)

  if (user?.role !== "superadmin") {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
