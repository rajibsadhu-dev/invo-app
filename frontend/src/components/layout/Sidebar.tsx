import { NavLink, useMatch, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  FileText,
  UserRound,
  ReceiptText,
  Building2,
  User,
  LogOut,
  ChevronUp,
  ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { clearCredentials } from "@/features/auth/authSlice"
import { useLogoutMutation } from "@/features/auth/authApi"
import { baseApi } from "@/services/baseApi"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent } from "@/components/ui/sheet"

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({
  to,
  icon: Icon,
  label,
  exact,
  onClick,
}: {
  to: string
  icon: React.ElementType
  label: string
  exact?: boolean
  onClick?: () => void
}) {
  return (
    <NavLink
      to={to}
      end={exact}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  )
}

// ─── Org Context Nav ───────────────────────────────────────────────────────────

function OrgContextNav({ orgId, onClose }: { orgId: number; onClose: () => void }) {
  const { data } = useGetOrganizationByIdQuery(orgId)
  const org = data?.data

  return (
    <div className="flex flex-col gap-0.5">
      <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 truncate">
        {org?.name ?? "Organization"}
      </p>
      <NavItem to={`/org/${orgId}`} icon={Building2} label="Overview" exact onClick={onClose} />
      <NavItem to={`/org/${orgId}/customers`} icon={UserRound} label="Customers" onClick={onClose} />
      <NavItem to={`/org/${orgId}/invoices`} icon={ReceiptText} label="Invoices" onClick={onClose} />
    </div>
  )
}

// ─── Sidebar Content ──────────────────────────────────────────────────────────

function SidebarContent({ onClose }: { onClose: () => void }) {
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const orgMatch = useMatch("/org/:orgId/*")
  const orgId = orgMatch?.params?.orgId ? Number(orgMatch.params.orgId) : null
  const [logoutApi] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap()
    } catch {
      // ignore — clear client state regardless
    }
    dispatch(clearCredentials())
    dispatch(baseApi.util.resetApiState())
    navigate("/login", { replace: true })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <FileText className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-heading text-base font-semibold tracking-tight">Invo</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-2">
        <div className="flex flex-col gap-0.5">
          <NavItem to="/" icon={LayoutDashboard} label="Dashboard" exact onClick={onClose} />
          <NavItem to="/organizations" icon={Building2} label="Organizations" onClick={onClose} />
          {user?.role === "superadmin" && (
            <NavItem to="/users" icon={Users} label="Users" onClick={onClose} />
          )}
        </div>

        {/* Superadmin section */}
        {user?.role === "superadmin" && (
          <div className="flex flex-col gap-0.5">
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Admin
            </p>
            <NavItem
              to="/admin/organizations"
              icon={ShieldCheck}
              label="All Organizations"
              onClick={onClose}
            />
          </div>
        )}

        {orgId && (
          <>
            <div className="-mx-2 h-px bg-border" />
            <OrgContextNav orgId={orgId} onClose={onClose} />
          </>
        )}
      </nav>

      {/* User section */}
      <div className="shrink-0 border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
                {user?.name?.[0] ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
              <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-52">
            <DropdownMenuItem
              onClick={() => {
                navigate("/profile")
                onClose()
              }}
            >
              <User className="mr-2 h-4 w-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  return (
    <>
      {/* Desktop — always visible */}
      <aside className="hidden lg:flex h-screen w-60 shrink-0 flex-col border-r bg-background">
        <SidebarContent onClose={() => {}} />
      </aside>

      {/* Mobile — Sheet drawer */}
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="left" className="w-60 p-0 [&>button]:hidden">
          <SidebarContent onClose={onClose} />
        </SheetContent>
      </Sheet>
    </>
  )
}
