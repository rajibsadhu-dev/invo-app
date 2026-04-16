import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { PlusIcon, Trash2, Loader2, Search, Building2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Input } from "@/components/ui/input"
import { InvoForm, InvoInput } from "@/components/form"
import {
  useGetAllOrganizationsQuery,
  useAdminCreateOrganizationMutation,
} from "@/features/admin/adminOrgApi"
import { useDeleteOrganizationMutation } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/BreadcrumbContext"
import type { OrganizationWithOwner } from "@/types"

// ─── Create Org Dialog ────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  registerNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  invoicePrefix: z.string().max(10, "Prefix max 10 chars").optional(),
})

type CreateForm = z.infer<typeof createSchema>

function CreateOrgDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [createOrg, { isLoading }] = useAdminCreateOrganizationMutation()

  const form = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      registerNumber: "",
      gstNumber: "",
      invoicePrefix: "",
    },
  })

  const onSubmit = async (values: CreateForm) => {
    try {
      await createOrg({
        name: values.name,
        address: values.address || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        registerNumber: values.registerNumber || undefined,
        gstNumber: values.gstNumber || undefined,
        invoicePrefix: values.invoicePrefix || undefined,
      }).unwrap()
      toast.success("Organization created successfully")
      onOpenChange(false)
      form.reset()
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to create organization")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
        </DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput control={form.control} name="name" label="Organization Name" required />
          <div className="grid grid-cols-2 gap-4">
            <InvoInput control={form.control} name="phone" label="Phone" />
            <InvoInput control={form.control} name="email" label="Email" type="email" />
          </div>
          <InvoInput control={form.control} name="address" label="Address" />
          <div className="grid grid-cols-2 gap-4">
            <InvoInput control={form.control} name="registerNumber" label="Register Number" />
            <InvoInput control={form.control} name="gstNumber" label="GST Number" />
          </div>
          <InvoInput
            control={form.control}
            name="invoicePrefix"
            label="Invoice Prefix"
            description="Max 10 characters. Defaults to INV."
          />
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

// ─── Delete Cell ──────────────────────────────────────────────────────────────

function DeleteOrgButton({ org }: { org: OrganizationWithOwner }) {
  const [deleteOrg, { isLoading }] = useDeleteOrganizationMutation()

  const handleDelete = async () => {
    try {
      await deleteOrg(org.id).unwrap()
      toast.success(`"${org.name}" deleted`)
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to delete organization")
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => e.stopPropagation()}
          />
        }
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete organization?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete <strong>{org.name}</strong> and all its customers
            and invoices. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isLoading} onClick={handleDelete}>
            {isLoading && <Loader2 className="animate-spin" />} Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminOrganizationsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)

  useBreadcrumbs([{ label: "Admin" }, { label: "All Organizations" }])

  // Debounce search input by 400ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading, isError } = useGetAllOrganizationsQuery(
    debouncedSearch || undefined
  )
  const orgs = data?.data ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">All Organizations</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Manage all organizations across the platform
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <PlusIcon className="h-4 w-4" /> Create Organization
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="rounded-xl bg-destructive/10 px-4 py-8 text-center text-sm text-destructive">
          Failed to load organizations.
        </div>
      ) : orgs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <Building2 className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {debouncedSearch ? "No organizations match your search." : "No organizations yet."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orgs.map((org, index) => (
                <TableRow
                  key={org.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/org/${org.id}`)}
                >
                  <TableCell className="text-muted-foreground text-sm">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{org.name}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground/50" />
                    </div>
                    {org.email && (
                      <p className="text-xs text-muted-foreground">{org.email}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{org.owner.name}</p>
                    <p className="text-xs text-muted-foreground">{org.owner.email}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {org.phone ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteOrgButton org={org} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
