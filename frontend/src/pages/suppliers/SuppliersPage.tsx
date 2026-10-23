import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  PlusIcon,
  Pencil,
  Trash2,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Truck,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { InvoForm, InvoInput } from "@/components/form"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} from "@/features/supplier/supplierApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import type { Supplier } from "@/types"
import { getApiErrorMessage } from "@/lib/apiError"

const supplierSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  gstNumber: z.string().max(15).optional().or(z.literal("")),
  stateCode: z
    .string()
    .regex(/^\d{2}$/, "Two-digit GST state code")
    .optional()
    .or(z.literal("")),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
})

type SupplierForm = z.infer<typeof supplierSchema>

function AddSupplierDialog({ orgId, open, onOpenChange }: { orgId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [createSupplier, { isLoading }] = useCreateSupplierMutation()

  const form = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
    defaultValues: { name: "", email: "", phone: "", address: "", gstNumber: "", stateCode: "", contactPerson: "", notes: "" },
  })

  const onSubmit = async (values: SupplierForm) => {
    try {
      await createSupplier({
        orgId,
        body: {
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
          address: values.address || undefined,
          gstNumber: values.gstNumber || undefined,
          stateCode: values.stateCode || undefined,
          contactPerson: values.contactPerson || undefined,
          notes: values.notes || undefined,
        },
      }).unwrap()
      toast.success("Supplier created")
      onOpenChange(false)
      form.reset()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create supplier"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Supplier</DialogTitle>
        </DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput control={form.control} name="name" label="Name" required />
          <InvoInput control={form.control} name="contactPerson" label="Contact Person" />
          <div className="grid grid-cols-2 gap-4">
            <InvoInput control={form.control} name="phone" label="Phone" />
            <InvoInput control={form.control} name="email" label="Email" type="email" />
          </div>
          <InvoInput control={form.control} name="gstNumber" label="GST Number" />
          <InvoInput
            control={form.control}
            name="stateCode"
            label="GST State Code"
            placeholder="e.g. 27"
          />
          <InvoInput control={form.control} name="address" label="Address" />
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} {...form.register("notes")} />
          </div>
          <DialogFooter className="mt-1">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />} Add Supplier
            </Button>
          </DialogFooter>
        </InvoForm>
      </DialogContent>
    </Dialog>
  )
}

function EditSupplierDialog({
  orgId,
  supplier,
  open,
  onOpenChange,
}: {
  orgId: number
  supplier: Supplier
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [updateSupplier, { isLoading }] = useUpdateSupplierMutation()

  const form = useForm<SupplierForm>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: supplier.name,
      email: supplier.email ?? "",
      phone: supplier.phone ?? "",
      address: supplier.address ?? "",
      gstNumber: supplier.gstNumber ?? "",
      stateCode: supplier.stateCode ?? "",
      contactPerson: supplier.contactPerson ?? "",
      notes: supplier.notes ?? "",
    },
  })

  const onSubmit = async (values: SupplierForm) => {
    try {
      await updateSupplier({
        orgId,
        supplierId: supplier.id,
        body: {
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
          address: values.address || undefined,
          gstNumber: values.gstNumber || undefined,
          stateCode: values.stateCode || undefined,
          contactPerson: values.contactPerson || undefined,
          notes: values.notes || undefined,
        },
      }).unwrap()
      toast.success("Supplier updated")
      onOpenChange(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update supplier"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Supplier</DialogTitle>
        </DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput control={form.control} name="name" label="Name" required />
          <InvoInput control={form.control} name="contactPerson" label="Contact Person" />
          <div className="grid grid-cols-2 gap-4">
            <InvoInput control={form.control} name="phone" label="Phone" />
            <InvoInput control={form.control} name="email" label="Email" type="email" />
          </div>
          <InvoInput control={form.control} name="gstNumber" label="GST Number" />
          <InvoInput
            control={form.control}
            name="stateCode"
            label="GST State Code"
            placeholder="e.g. 27"
          />
          <InvoInput control={form.control} name="address" label="Address" />
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} {...form.register("notes")} />
          </div>
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

export default function SuppliersPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const id = Number(orgId)

  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)
  const limit = 10

  const [addOpen, setAddOpen] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Suppliers" },
  ])

  const { data, isLoading, isError } = useGetSuppliersQuery({
    orgId: id,
    search: search || undefined,
    page,
    limit,
  })

  const [deleteSupplier, { isLoading: isDeleting }] = useDeleteSupplierMutation()

  const suppliers = data?.data ?? []
  const meta = data?.meta

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleDelete = async (supplierId: number) => {
    try {
      await deleteSupplier({ orgId: id, supplierId }).unwrap()
      toast.success("Supplier deleted")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete supplier"))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            {org?.name ?? "Organization"} · {meta?.total ?? 0} total
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusIcon /> Add Supplier
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, contact…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(""); setSearchInput(""); setPage(1) }}
          >
            Clear
          </Button>
        )}
      </form>

      <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>GST</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Loading suppliers…
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-destructive">
                  Failed to load suppliers
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && suppliers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {search ? "No suppliers match your search" : "No suppliers yet"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {suppliers.map((supplier) => (
              <TableRow
                key={supplier.id}
                className="cursor-pointer"
                onClick={() => navigate(`/org/${id}/suppliers/${supplier.id}`)}
              >
                <TableCell className="font-medium">{supplier.name}</TableCell>
                <TableCell className="text-muted-foreground">{supplier.contactPerson ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{supplier.phone ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground text-xs">{supplier.gstNumber ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={supplier.isActive ? "outline" : "secondary"} className="text-[10px]">
                    {supplier.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditSupplier(supplier)}>
                      <Pencil />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <Trash2 className="text-destructive" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete supplier?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong>{supplier.name}</strong>. Suppliers with purchase orders cannot be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={() => handleDelete(supplier.id)}
                          >
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

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {meta.page} of {meta.totalPages} · {meta.total} suppliers</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon-sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AddSupplierDialog orgId={id} open={addOpen} onOpenChange={setAddOpen} />
      {editSupplier && (
        <EditSupplierDialog
          orgId={id}
          supplier={editSupplier}
          open={!!editSupplier}
          onOpenChange={(v) => { if (!v) setEditSupplier(null) }}
        />
      )}
    </div>
  )
}
