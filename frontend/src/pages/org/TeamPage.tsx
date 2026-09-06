import { useState } from "react"
import { useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Loader2,
  Users,
  ShieldCheck,
  Shield,
  User,
  Trash2,
  UserPlus,
  Mail,
  Clock,
  X,
  Eye,
  Briefcase,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { InvoForm, InvoInput, InvoSelect } from "@/components/form"
import {
  useGetTeamMembersQuery,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
} from "@/features/org/teamApi"
import {
  useGetInvitesQuery,
  useCreateInviteMutation,
  useRevokeInviteMutation,
} from "@/features/org/inviteApi"
import { useAppSelector } from "@/store/hooks"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import type { OrgMember, OrgRole, OrgInvite } from "@/types"
import { getApiErrorMessage } from "@/lib/apiError"

const ROLE_ICON: Record<string, React.ElementType> = {
  owner: ShieldCheck,
  admin: Shield,
  manager: Briefcase,
  staff: User,
  viewer: Eye,
}

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  manager: "secondary",
  staff: "outline",
  viewer: "outline",
}

// ─── Member Row ─────────────────────────────────────────────────────────────

function MemberRow({
  member,
  orgId,
  isCurrentUser,
  canManage,
}: {
  member: OrgMember
  orgId: number
  isCurrentUser: boolean
  canManage: boolean
}) {
  const [updateRole] = useUpdateMemberRoleMutation()
  const [removeMember, { isLoading: isRemoving }] = useRemoveMemberMutation()

  const handleRoleChange = async (role: string) => {
    try {
      await updateRole({ orgId, memberId: member.id, role: role as OrgRole }).unwrap()
      toast.success("Role updated")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update role"))
    }
  }

  const handleRemove = async () => {
    try {
      await removeMember({ orgId, memberId: member.id }).unwrap()
      toast.success("Member removed")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to remove member"))
    }
  }

  const Icon = ROLE_ICON[member.role] ?? User

  return (
    <div className="flex items-center gap-4 py-3 [&:not(:last-child)]:border-b">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold uppercase">
        {member.user.name[0]}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {member.user.name}
          {isCurrentUser && (
            <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">{member.user.email}</p>
      </div>

      {member.role === "owner" ? (
        <Badge variant={ROLE_VARIANT[member.role] ?? "outline"} className="capitalize">
          <Icon className="mr-1 h-3 w-3" />
          {member.role}
        </Badge>
      ) : canManage && !isCurrentUser ? (
        <Select value={member.role} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
            <SelectItem value="viewer">Viewer</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Badge variant={ROLE_VARIANT[member.role] ?? "outline"} className="capitalize">
          <Icon className="mr-1 h-3 w-3" />
          {member.role}
        </Badge>
      )}

      {canManage && !isCurrentUser && member.role !== "owner" && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove member?</AlertDialogTitle>
              <AlertDialogDescription>
                {member.user.name} will lose access to this organization.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemove} disabled={isRemoving}>
                {isRemoving ? "Removing..." : "Remove"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

// ─── Invite Row ─────────────────────────────────────────────────────────────

function InviteRow({
  invite,
  orgId,
  canManage,
}: {
  invite: OrgInvite
  orgId: number
  canManage: boolean
}) {
  const [revoke, { isLoading }] = useRevokeInviteMutation()

  const handleRevoke = async () => {
    try {
      await revoke({ orgId, inviteId: invite.id }).unwrap()
      toast.success("Invitation revoked")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to revoke invitation"))
    }
  }

  const isExpired = new Date(invite.expiresAt) < new Date()

  return (
    <div className="flex items-center gap-4 py-3 [&:not(:last-child)]:border-b">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <Mail className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{invite.email}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {isExpired ? "Expired" : `Expires ${new Date(invite.expiresAt).toLocaleDateString()}`}
        </p>
      </div>
      <Badge variant="outline" className="capitalize">
        {invite.role}
      </Badge>
      {canManage && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRevoke}
          disabled={isLoading}
          className="text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

// ─── Invite Dialog ──────────────────────────────────────────────────────────

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "manager", "staff", "viewer"]),
})

type InviteForm = z.infer<typeof inviteSchema>

function InviteDialog({
  open,
  onOpenChange,
  orgId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  orgId: number
}) {
  const [createInvite, { isLoading }] = useCreateInviteMutation()

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "staff" },
  })

  const onSubmit = async (values: InviteForm) => {
    try {
      await createInvite({ orgId, ...values }).unwrap()
      toast.success(`Invitation sent to ${values.email}`)
      form.reset()
      onOpenChange(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to send invitation"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput
            control={form.control}
            name="email"
            label="Email address"
            type="email"
            placeholder="colleague@example.com"
            required
          />
          <InvoSelect
            control={form.control}
            name="role"
            label="Role"
            options={[
              { label: "Admin", value: "admin" },
              { label: "Manager", value: "manager" },
              { label: "Staff", value: "staff" },
              { label: "Viewer", value: "viewer" },
            ]}
            required
          />
          <DialogFooter className="mt-1">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />} Send Invitation
            </Button>
          </DialogFooter>
        </InvoForm>
      </DialogContent>
    </Dialog>
  )
}

// ─── Team Page ──────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const orgIdNum = Number(orgId)
  const currentUser = useAppSelector((s) => s.auth.user)
  const { data, isLoading, error } = useGetTeamMembersQuery(orgIdNum)
  const { data: invitesData } = useGetInvitesQuery(orgIdNum)
  const [inviteOpen, setInviteOpen] = useState(false)

  useBreadcrumbs([
    { label: "Dashboard", to: "/" },
    { label: "Organization", to: `/org/${orgId}` },
    { label: "Team" },
  ])

  const members = data?.data ?? []
  const invites = invitesData?.data ?? []
  const currentMembership = members.find((m) => m.userId === currentUser?.id)
  const canManageTeam =
    currentUser?.role === "superadmin" ||
    currentMembership?.role === "owner" ||
    currentMembership?.role === "admin"
  const canInvite =
    canManageTeam || currentMembership?.role === "manager"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <p className="py-12 text-center text-sm text-destructive">
        Failed to load team members.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold">Team</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} member{members.length !== 1 && "s"}
          </p>
        </div>
        {canInvite && (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" /> Invite
          </Button>
        )}
      </div>

      <div className="mx-auto w-full max-w-2xl flex flex-col gap-6">
        <Card>
          <CardHeader className="border-b pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" /> Members
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                orgId={orgIdNum}
                isCurrentUser={member.userId === currentUser?.id}
                canManage={canManageTeam}
              />
            ))}
            {members.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No team members yet.
              </p>
            )}
          </CardContent>
        </Card>

        {canInvite && invites.length > 0 && (
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail className="h-4 w-4" /> Pending Invitations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {invites.map((invite) => (
                <InviteRow
                  key={invite.id}
                  invite={invite}
                  orgId={orgIdNum}
                  canManage={canInvite}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} orgId={orgIdNum} />
    </div>
  )
}
