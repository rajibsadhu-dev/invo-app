import { useState, useRef, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Pencil,
  Trash2,
  Loader2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Hash,
  FileText,
  Upload,
  UserRoundCog,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Badge } from "@/components/ui/badge"
import { InvoForm, InvoInput, InvoSelect } from "@/components/form"
import {
  useGetOrganizationByIdQuery,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
  useUploadOrgLogoMutation,
} from "@/features/org/orgApi"
import { useGetUsersQuery } from "@/features/user/userApi"
import { useAssignOrganizationMutation } from "@/features/admin/adminOrgApi"
import { useAppSelector } from "@/store/hooks"
import { useBreadcrumbs } from "@/context/BreadcrumbContext"
import type { Organization } from "@/types"

// ─── Edit Dialog ───────────────────────────────────────────────────────────────

const editSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  registerNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  invoicePrefix: z.string().max(6, "Prefix max 6 chars").optional(),
})

type EditForm = z.infer<typeof editSchema>

function EditOrgDialog({
  org,
  open,
  onOpenChange,
  refetch,
}: {
  org: Organization
  open: boolean
  onOpenChange: (v: boolean) => void
  refetch: () => void
}) {
  const [updateOrg, { isLoading }] = useUpdateOrganizationMutation()

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: org.name,
      address: org.address ?? "",
      phone: org.phone ?? "",
      email: org.email ?? "",
      registerNumber: org.registerNumber ?? "",
      gstNumber: org.gstNumber ?? "",
      invoicePrefix: org.invoicePrefix,
    },
  })

  useEffect(() => {
    form.reset({
      name: org.name,
      address: org.address ?? "",
      phone: org.phone ?? "",
      email: org.email ?? "",
      registerNumber: org.registerNumber ?? "",
      gstNumber: org.gstNumber ?? "",
      invoicePrefix: org.invoicePrefix,
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org.id, org.updatedAt])

  const onSubmit = async (values: EditForm) => {
    try {
      await updateOrg({
        id: org.id,
        body: {
          name: values.name,
          address: values.address || undefined,
          phone: values.phone || undefined,
          email: values.email || undefined,
          registerNumber: values.registerNumber || undefined,
          gstNumber: values.gstNumber || undefined,
          invoicePrefix: values.invoicePrefix || undefined,
        },
      }).unwrap()
      refetch()
      toast.success("Organization updated successfully")
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update organization")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Organization</DialogTitle>
        </DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput
            control={form.control}
            name="name"
            label="Organization Name"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <InvoInput control={form.control} name="phone" label="Phone" />
            <InvoInput
              control={form.control}
              name="email"
              label="Email"
              type="email"
            />
          </div>
          <InvoInput control={form.control} name="address" label="Address" />
          <div className="grid grid-cols-2 gap-4">
            <InvoInput
              control={form.control}
              name="registerNumber"
              label="Register Number"
            />
            <InvoInput
              control={form.control}
              name="gstNumber"
              label="GST Number"
            />
          </div>
          <InvoInput
            control={form.control}
            name="invoicePrefix"
            label="Invoice Prefix"
            description="Max 6 characters."
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

// ─── Assign Org Dialog ─────────────────────────────────────────────────────────

const assignSchema = z.object({
  userId: z.string().min(1, "Please select a user"),
})

type AssignForm = z.infer<typeof assignSchema>

function AssignOrgDialog({
  orgId,
  open,
  onOpenChange,
}: {
  orgId: number
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { data: usersData } = useGetUsersQuery()
  const [assignOrg, { isLoading }] = useAssignOrganizationMutation()

  const userOptions =
    usersData?.data?.map((u) => ({
      value: String(u.id),
      label: `${u.name} (${u.email})`,
    })) ?? []

  const form = useForm<AssignForm>({
    resolver: zodResolver(assignSchema),
    defaultValues: { userId: "" },
  })

  const onSubmit = async (values: AssignForm) => {
    try {
      await assignOrg({ orgId, userId: Number(values.userId) }).unwrap()
      toast.success("Organization assigned successfully")
      onOpenChange(false)
      form.reset()
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to assign organization")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Organization</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Transfer ownership of this organization to another user.
        </p>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoSelect
            control={form.control}
            name="userId"
            label="Select User"
            options={userOptions}
            required
          />
          <DialogFooter className="mt-1">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />} Assign
            </Button>
          </DialogFooter>
        </InvoForm>
      </DialogContent>
    </Dialog>
  )
}

// ─── Detail Row ────────────────────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value?: string | number | null
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

// ─── Logo Section ──────────────────────────────────────────────────────────────

function LogoSection({ org }: { org: Organization }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadLogo, { isLoading }] = useUploadOrgLogoMutation()
  const logoUrl = org.logo
    ? `${import.meta.env.VITE_API_URL}/uploads/${org.logo}`
    : null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadLogo({ id: org.id, file }).unwrap()
      toast.success("Logo uploaded successfully")
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to upload logo")
    }
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={org.name}
          className="h-24 w-24 rounded-xl object-cover ring-2 ring-foreground/10"
        />
      ) : (
        <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="h-10 w-10" />
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        size="sm"
        variant="outline"
        disabled={isLoading}
        onClick={() => fileRef.current?.click()}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        {org.logo ? "Change Logo" : "Upload Logo"}
      </Button>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function OrgDetailPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const id = Number(orgId)

  const currentUser = useAppSelector((s) => s.auth.user)
  const isSuperadmin = currentUser?.role === "superadmin"

  const { data, isLoading, isError, refetch } = useGetOrganizationByIdQuery(id)
  const [deleteOrg, { isLoading: isDeleting }] = useDeleteOrganizationMutation()
  const [editOpen, setEditOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)

  const org = data?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization" },
  ])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !org) {
    return (
      <div className="rounded-xl bg-destructive/10 px-4 py-8 text-center text-sm text-destructive">
        Organization not found or access denied.
      </div>
    )
  }

  const handleDelete = async () => {
    try {
      await deleteOrg(org.id).unwrap()
      toast.success("Organization deleted")
      navigate("/", { replace: true })
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to delete organization")
    }
  }

  const nextInvoiceCode = `${org.invoicePrefix}-${String(org.nextInvoiceNumber).padStart(4, "0")}`

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">{org.name}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Organization overview &amp; settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperadmin && (
            <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
              <UserRoundCog className="h-3.5 w-3.5" /> Assign
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger render={<Button size="sm" variant="outline" className="text-destructive hover:text-destructive" />}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete organization?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>{org.name}</strong> and
                  all its customers and invoices. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting && <Loader2 className="animate-spin" />} Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left — Logo + Invoice info */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <LogoSection org={org} />
              <div className="w-full border-t pt-4 text-center">
                <p className="text-xs text-muted-foreground">Next Invoice</p>
                <p className="mt-1 font-heading text-lg font-semibold tracking-wide">
                  {nextInvoiceCode}
                </p>
                <Badge variant="secondary" className="mt-1.5 text-xs">
                  Prefix: {org.invoicePrefix}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <DetailRow icon={Building2} label="Organization Name" value={org.name} />
            <DetailRow icon={Phone} label="Phone" value={org.phone} />
            <DetailRow icon={Mail} label="Email" value={org.email} />
            <DetailRow icon={MapPin} label="Address" value={org.address} />
            <DetailRow
              icon={Hash}
              label="Register Number"
              value={org.registerNumber}
            />
            <DetailRow
              icon={Hash}
              label="GST Number"
              value={org.gstNumber}
            />
            <DetailRow
              icon={FileText}
              label="Invoice Prefix"
              value={org.invoicePrefix}
            />
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      {org && (
        <EditOrgDialog
          org={org}
          open={editOpen}
          onOpenChange={setEditOpen}
          refetch={refetch}
        />
      )}

      {/* Assign Dialog — superadmin only */}
      {isSuperadmin && (
        <AssignOrgDialog
          orgId={org.id}
          open={assignOpen}
          onOpenChange={setAssignOpen}
        />
      )}
    </div>
  )
}
