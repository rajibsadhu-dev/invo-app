import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PlusIcon, Pencil, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { InvoForm, InvoInput, InvoSelect } from "@/components/form"
import {
  useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation,
} from "@/features/user/userApi"
import type { User } from "@/types"

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "superadmin", label: "Superadmin" },
]

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  role: z.enum(["superadmin", "user"]),
})

const editSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.union([z.string().min(6, "Password must be at least 6 characters"), z.literal("")]).optional(),
  phone: z.string().optional(),
  role: z.enum(["superadmin", "user"]),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

// ─── Create Dialog ─────────────────────────────────────────────────────────────

function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const [createUser, { isLoading }] = useCreateUserMutation()

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: "", email: "", password: "", phone: "", role: "user" },
  })

  const onSubmit = async (values: CreateForm) => {
    try {
      await createUser({ ...values, phone: values.phone || undefined }).unwrap()
      toast.success("User created successfully")
      setOpen(false)
      form.reset()
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to create user")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon />Create User
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput control={form.control} name="name" label="Name" placeholder="John Doe" required />
          <InvoInput control={form.control} name="email" label="Email" type="email" placeholder="john@example.com" required />
          <InvoInput control={form.control} name="password" label="Password" type="password" placeholder="••••••••" required />
          <InvoInput control={form.control} name="phone" label="Phone" placeholder="+880..." description="Optional" />
          <InvoSelect control={form.control} name="role" label="Role" options={ROLE_OPTIONS} required />
          <DialogFooter className="mt-1">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />} Create
            </Button>
          </DialogFooter>
        </InvoForm>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit Dialog ───────────────────────────────────────────────────────────────

function EditUserDialog({
  user, open, onOpenChange,
}: { user: User; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [updateUser, { isLoading }] = useUpdateUserMutation()

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: user.name, email: user.email, phone: user.phone ?? "", role: user.role, password: "" },
  })

  const onSubmit = async (values: EditForm) => {
    const body: Record<string, any> = {
      name: values.name,
      email: values.email,
      role: values.role,
    }
    if (values.password) body.password = values.password
    if (values.phone !== undefined) body.phone = values.phone || undefined

    try {
      await updateUser({ id: user.id, body }).unwrap()
      toast.success("User updated successfully")
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update user")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput control={form.control} name="name" label="Name" required />
          <InvoInput control={form.control} name="email" label="Email" type="email" required />
          <InvoInput control={form.control} name="password" label="New Password" type="password" placeholder="••••••••" description="Leave blank to keep current password" />
          <InvoInput control={form.control} name="phone" label="Phone" description="Optional" />
          <InvoSelect control={form.control} name="role" label="Role" options={ROLE_OPTIONS} required />
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { data, isLoading, isError } = useGetUsersQuery()
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation()
  const [editUser, setEditUser] = useState<User | null>(null)
  const users = data?.data ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">Manage system users and their roles</p>
        </div>
        <CreateUserDialog />
      </div>

      <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Loading users…</TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-destructive">Failed to load users</TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No users found</TableCell>
              </TableRow>
            )}
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="text-muted-foreground">{user.id}</TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell className="text-muted-foreground">{user.phone ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "superadmin" ? "default" : "secondary"} className="capitalize">
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditUser(user)}>
                      <Pencil /><span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <Trash2 className="text-destructive" /><span className="sr-only">Delete</span>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete user?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong>{user.name}</strong>. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={() => deleteUser(user.id).unwrap().then(() => toast.success("User deleted")).catch((err: any) => toast.error(err?.data?.message ?? "Failed to delete user"))}>
                            {isDeleting && <Loader2 className="animate-spin" />} Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editUser && (
        <EditUserDialog
          user={editUser}
          open={!!editUser}
          onOpenChange={(v) => { if (!v) setEditUser(null) }}
        />
      )}
    </div>
  )
}
