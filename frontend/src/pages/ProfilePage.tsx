import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, UserCircle, Pencil, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { InvoForm, InvoInput } from "@/components/form"
import {
  useUpdateMeMutation,
  useChangePasswordMutation,
} from "@/features/auth/authApi"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { setUser, clearCredentials } from "@/features/auth/authSlice"
import { useBreadcrumbs } from "@/context/breadcrumbStore"

// ─── Schemas ───────────────────────────────────────────────────────────────────

const editSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
})

type EditProfileForm = z.infer<typeof editSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    message: "New password must differ from the current one",
    path: ["newPassword"],
  })

type ChangePasswordForm = z.infer<typeof passwordSchema>

// ─── Edit Profile ──────────────────────────────────────────────────────────────

function EditProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const user = useAppSelector((s) => s.auth.user)
  const dispatch = useAppDispatch()
  // /auth/me, not /users/:id — the latter is superadmin-only and 403s for a normal user.
  const [updateMe, { isLoading }] = useUpdateMeMutation()

  const form = useForm<EditProfileForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
    },
  })

  const onSubmit = async (values: EditProfileForm) => {
    try {
      const result = await updateMe({
        name: values.name,
        email: values.email,
        phone: values.phone ?? "",
      }).unwrap()

      dispatch(
        setUser({
          id: result.data.id,
          name: result.data.name,
          email: result.data.email,
          role: result.data.role,
          phone: result.data.phone,
          emailVerifiedAt: result.data.emailVerifiedAt,
        })
      )
      toast.success("Profile updated successfully")
      onOpenChange(false)
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message
      toast.error(message ?? "Failed to update profile")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput control={form.control} name="name" label="Name" required />
          <InvoInput
            control={form.control}
            name="email"
            label="Email"
            type="email"
            required
          />
          <InvoInput
            control={form.control}
            name="phone"
            label="Phone"
            placeholder="+91..."
            description="Optional"
          />
          <DialogFooter className="mt-1">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />} Save changes
            </Button>
          </DialogFooter>
        </InvoForm>
      </DialogContent>
    </Dialog>
  )
}

// ─── Change Password ───────────────────────────────────────────────────────────

function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const dispatch = useAppDispatch()
  const [changePassword, { isLoading }] = useChangePasswordMutation()

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  const onSubmit = async (values: ChangePasswordForm) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap()

      toast.success("Password changed. Please sign in again.")
      onOpenChange(false)
      // The server revoked every session, this one included.
      dispatch(clearCredentials())
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message
      toast.error(message ?? "Failed to change password")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            You will be signed out of all devices and need to sign in again.
          </DialogDescription>
        </DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput
            control={form.control}
            name="currentPassword"
            label="Current password"
            type="password"
            autoComplete="current-password"
            required
          />
          <InvoInput
            control={form.control}
            name="newPassword"
            label="New password"
            type="password"
            autoComplete="new-password"
            required
          />
          <InvoInput
            control={form.control}
            name="confirmPassword"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            required
          />
          <DialogFooter className="mt-1">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />} Change password
            </Button>
          </DialogFooter>
        </InvoForm>
      </DialogContent>
    </Dialog>
  )
}

// ─── Profile Row ──────────────────────────────────────────────────────────────

function ProfileRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 [&:not(:last-child)]:border-b">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  )
}

// ─── Profile Page ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  useBreadcrumbs([{ label: "Dashboard", to: "/" }, { label: "Profile" }])
  const user = useAppSelector((s) => s.auth.user)
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground">Your account information</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPasswordOpen(true)}>
            <KeyRound className="h-3.5 w-3.5" /> Change Password
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit Profile
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-xl font-semibold uppercase">
                {user?.name?.[0] ?? (
                  <UserCircle className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <div>
                <CardTitle>{user?.name}</CardTitle>
                <div className="mt-1">
                  <Badge
                    variant={user?.role === "superadmin" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {user?.role}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ProfileRow label="Name" value={user?.name} />
            <ProfileRow label="Email" value={user?.email} />
            <ProfileRow label="Phone" value={user?.phone} />
            <ProfileRow label="Role" value={user?.role} />
          </CardContent>
        </Card>
      </div>

      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </div>
  )
}
