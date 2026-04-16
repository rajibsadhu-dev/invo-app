import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Pencil,
  Trash2,
  Loader2,
  Phone,
  Mail,
  MapPin,
  Hash,
  ReceiptText,
  User,
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
import { InvoForm, InvoInput } from "@/components/form"
import {
  useGetCustomerByIdQuery,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from "@/features/customer/customerApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/BreadcrumbContext"
import type { Customer } from "@/types"

// ─── Schema ───────────────────────────────────────────────────────────────────

const editSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  gstNumber: z.string().optional(),
})

type EditForm = z.infer<typeof editSchema>

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

  const form = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: customer.name,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      address: customer.address ?? "",
      gstNumber: customer.gstNumber ?? "",
    },
  })

  const onSubmit = async (values: EditForm) => {
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
        },
      }).unwrap()
      toast.success("Customer updated successfully")
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update customer")
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

// ─── Detail Row ────────────────────────────────────────────────────────────────

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value?: string | null
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function CustomerDetailPage() {
  const { orgId, customerId } = useParams<{ orgId: string; customerId: string }>()
  const navigate = useNavigate()
  const oId = Number(orgId)
  const cId = Number(customerId)

  const [editOpen, setEditOpen] = useState(false)

  const { data: orgData } = useGetOrganizationByIdQuery(oId)
  const org = orgData?.data

  const { data, isLoading, isError } = useGetCustomerByIdQuery({ orgId: oId, customerId: cId })
  const [deleteCustomer, { isLoading: isDeleting }] = useDeleteCustomerMutation()

  const customer = data?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${oId}` },
    { label: "Customers", to: `/org/${oId}/customers` },
    { label: customer?.name ?? "Customer" },
  ])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !customer) {
    return (
      <div className="rounded-xl bg-destructive/10 px-4 py-8 text-center text-sm text-destructive">
        Customer not found or access denied.
      </div>
    )
  }

  const handleDelete = async () => {
    try {
      await deleteCustomer({ orgId: oId, customerId: cId }).unwrap()
      toast.success("Customer deleted")
      navigate(`/org/${oId}/customers`, { replace: true })
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to delete customer")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">{customer.name}</h1>
          <p className="text-sm text-muted-foreground">Customer details</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger render={<Button size="sm" variant="outline" className="text-destructive hover:text-destructive" />}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
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
                  onClick={handleDelete}
                >
                  {isDeleting && <Loader2 className="animate-spin" />} Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Details card */}
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <DetailRow icon={User} label="Name" value={customer.name} />
            <DetailRow icon={Phone} label="Phone" value={customer.phone} />
            <DetailRow icon={Mail} label="Email" value={customer.email} />
            <DetailRow icon={MapPin} label="Address" value={customer.address} />
            <DetailRow icon={Hash} label="GST Number" value={customer.gstNumber} />
          </CardContent>
        </Card>

        {/* Invoices placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <ReceiptText className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Invoices coming soon</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Invoice management will be available in Phase 4.
            </p>
          </CardContent>
        </Card>
      </div>

      <EditCustomerDialog
        orgId={oId}
        customer={customer}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  )
}
