import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, UserCircle, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { InvoForm, InvoInput } from "@/components/form"
import { useUpdateUserMutation } from "@/features/user/userApi"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { setCredentials } from "@/features/auth/authSlice"
import { useBreadcrumbs } from "@/context/BreadcrumbContext"

// ─── Edit Schema ───────────────────────────────────────────────────────────────

const editSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z
    .union([
      z.string().min(6, "Password must be at least 6 characters"),
      z.literal(""),
    ])
    .optional(),
})

type EditProfileForm = z.infer<typeof editSchema>

// ─── Edit Dialog ───────────────────────────────────────────────────────────────

function EditProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const user = useAppSelector((s) => s.auth.user)
  const accessToken = useAppSelector((s) => s.auth.accessToken)
  const dispatch = useAppDispatch()
  const [updateUser, { isLoading }] = useUpdateUserMutation()

  const form = useForm<EditProfileForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: "",
      password: "",
    },
  })

  const onSubmit = async (values: EditProfileForm) => {
    if (!user) return
    const body: Record<string, any> = {
      name: values.name,
      email: values.email,
    }
    if (values.phone) body.phone = values.phone
    if (values.password) body.password = values.password

    try {
      const result = await updateUser({ id: user.id, body }).unwrap()
      // Update persisted auth state with new name/email
      if (accessToken) {
        dispatch(
          setCredentials({
            user: {
              id: result.data.id,
              name: result.data.name,
              email: result.data.email,
              role: result.data.role,
            },
            accessToken,
          })
        )
      }
      toast.success("Profile updated successfully")
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update profile")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput
            control={form.control}
            name="name"
            label="Name"
            required
          />
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
            placeholder="+880..."
            description="Optional"
          />
          <InvoInput
            control={form.control}
            name="password"
            label="New Password"
            type="password"
            placeholder="••••••••"
            description="Leave blank to keep current password"
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Your account information
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="h-3.5 w-3.5" /> Edit Profile
        </Button>
      </div>

      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader className="border-b">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-xl font-semibold uppercase">
                {user?.name?.[0] ?? <UserCircle className="h-7 w-7 text-muted-foreground" />}
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
    </div>
  )
}
