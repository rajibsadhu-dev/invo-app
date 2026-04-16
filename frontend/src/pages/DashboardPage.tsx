import { useBreadcrumbs } from "@/context/BreadcrumbContext"
import { useAppSelector } from "@/store/hooks"

export default function DashboardPage() {
  useBreadcrumbs([{ label: "Dashboard" }])
  const user = useAppSelector((s) => s.auth.user)

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-xl font-semibold">
        Welcome back, {user?.name?.split(" ")[0]}
      </h1>
      <p className="text-sm text-muted-foreground">
        Select an organization from the sidebar to get started.
      </p>
    </div>
  )
}
