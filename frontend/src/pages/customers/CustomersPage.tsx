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
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from "@/features/customer/customerApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import type { Customer } from "@/types"
import { getApiErrorMessage } from "@/lib/apiError"

// ─── Schemas ──────────────────────────────────────────────────────────────────

const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
  stateCode: z
    .string()
    .regex(/^\d{2}$/, "Two-digit GST state code (e.g. 27)")
    .optional()
    .or(z.literal("")),
})

type CustomerForm = z.infer<typeof customerSchema>

// ─── Add Dialog ────────────────────────────────────────────────────────────────

function AddCustomerDialog({ orgId, open, onOpenChange }: { orgId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const [createCustomer, { isLoading }] = useCreateCustomerMutation()

  const form = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", email: "", phone: "", address: "", gstNumber: "", stateCode: "" },
  })

  const onSubmit = async (values: CustomerForm) => {
    try {
      await createCustomer({
        orgId,
        body: {
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
          address: values.address || undefined,
          gstNumber: values.gstNumber || undefined,
          stateCode: values.stateCode || undefined,
        },
      }).unwrap()
      toast.success("Customer created successfully")
      onOpenChange(false)
      form.reset()
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create customer"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Customer</DialogTitle>
        </DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput control={form.control} name="name" label="Name" required />
          <div className="grid grid-cols-2 gap-4">
            <InvoInput control={form.control} name="phone" label="Phone" />
            <InvoInput control={form.control} name="email" label="Email" type="email" />
          </div>
          <InvoInput control={form.control} name="address" label="Address" />
          <InvoInput control={form.control} name="gstNumber" label="GST Number" />
          <InvoInput
            control={form.control}
            name="stateCode"
            label="GST State Code"
            placeholder="e.g. 27"
            description="Two digits — required for GST invoices"
          />
          <DialogFooter className="mt-1">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />} Add Customer
            </Button>
          </DialogFooter>
        </InvoForm>
      </DialogContent>
    </Dialog>
  )
}

// ─── Edit Dialog ───────────────────────────────────────────────────────────────

function EditCustomerDialog({
  orgId,
  customer,
  open,
  onOpenChange,
}: {
  orgId: number
  customer: Customer
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [updateCustomer, { isLoading }] = useUpdateCustomerMutation()

  const form = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer.name,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      address: customer.address ?? "",
      gstNumber: customer.gstNumber ?? "",
      stateCode: customer.stateCode ?? "",
    },
  })

  const onSubmit = async (values: CustomerForm) => {
    try {
      await updateCustomer({
        orgId,
        customerId: customer.id,
        body: {
          name: values.name,
          email: values.email || undefined,
          phone: values.phone || undefined,
          address: values.address || undefined,
          gstNumber: values.gstNumber || undefined,
          stateCode: values.stateCode || undefined,
        },
      }).unwrap()
      toast.success("Customer updated successfully")
      onOpenChange(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update customer"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput control={form.control} name="name" label="Name" required />
          <div className="grid grid-cols-2 gap-4">
            <InvoInput control={form.control} name="phone" label="Phone" />
            <InvoInput control={form.control} name="email" label="Email" type="email" />
          </div>
          <InvoInput control={form.control} name="address" label="Address" />
          <InvoInput control={form.control} name="gstNumber" label="GST Number" />
          <InvoInput
            control={form.control}
            name="stateCode"
            label="GST State Code"
            placeholder="e.g. 27"
            description="Two digits — required for GST invoices"
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const id = Number(orgId)

  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [page, setPage] = useState(1)
  const limit = 10

  const [addOpen, setAddOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Customers" },
  ])

  const { data, isLoading, isError } = useGetCustomersQuery({
    orgId: id,
    search: search || undefined,
    page,
    limit,
  })

  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation()

  const customers = data?.data ?? []
  const meta = data?.meta

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleDelete = async (customerId: number) => {
    try {
      await deleteCustomer({ orgId: id, customerId }).unwrap()
      toast.success("Customer deleted")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete customer"))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">
            {org?.name ?? "Organization"} · {meta?.total ?? 0} total
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <PlusIcon /> Add Customer
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone…"
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
            onClick={() => {
              setSearch("")
              setSearchInput("")
              setPage(1)
            }}
          >
            Clear
          </Button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>GST Number</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Loading customers…
                </TableCell>
              </TableRow>
            )}
            {isError && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-destructive">
                  Failed to load customers
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {search ? "No customers match your search" : "No customers yet"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {customers.map((customer) => (
              <TableRow
                key={customer.id}
                className="cursor-pointer"
                onClick={() => navigate(`/org/${id}/customers/${customer.id}`)}
              >
                <TableCell className="text-muted-foreground">{customer.id}</TableCell>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell className="text-muted-foreground">{customer.email ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{customer.phone ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{customer.gstNumber ?? "—"}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEditCustomer(customer)}
                    >
                      <Pencil />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <Trash2 className="text-destructive" />
                        <span className="sr-only">Delete</span>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete customer?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong>{customer.name}</strong>. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={() => handleDelete(customer.id)}
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

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {meta.page} of {meta.totalPages} · {meta.total} customers
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddCustomerDialog orgId={id} open={addOpen} onOpenChange={setAddOpen} />
      {editCustomer && (
        <EditCustomerDialog
          orgId={id}
          customer={editCustomer}
          open={!!editCustomer}
          onOpenChange={(v) => { if (!v) setEditCustomer(null) }}
        />
      )}
    </div>
  )
}
