import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  PlusIcon,
  Loader2,
  Building2,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { InvoForm, InvoInput } from "@/components/form"
import {
  useGetMyOrganizationsQuery,
  useCreateOrganizationMutation,
} from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/BreadcrumbContext"
import type { Organization } from "@/types"

// ─── Schema ───────────────────────────────────────────────────────────────────

const createOrgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  registerNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  invoicePrefix: z.string().max(6, "Prefix max 6 chars").optional(),
})

type CreateOrgForm = z.infer<typeof createOrgSchema>

// ─── Create Dialog ─────────────────────────────────────────────────────────────

function CreateOrgDialog() {
  const [open, setOpen] = useState(false)
  const [createOrg, { isLoading }] = useCreateOrganizationMutation()

  const form = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
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

  const onSubmit = async (values: CreateOrgForm) => {
    try {
      const payload = {
        name: values.name,
        ...(values.address && { address: values.address }),
        ...(values.phone && { phone: values.phone }),
        ...(values.email && { email: values.email }),
        ...(values.registerNumber && { registerNumber: values.registerNumber }),
        ...(values.gstNumber && { gstNumber: values.gstNumber }),
        ...(values.invoicePrefix && { invoicePrefix: values.invoicePrefix }),
      }
      await createOrg(payload).unwrap()
      toast.success("Organization created successfully")
      setOpen(false)
      form.reset()
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to create organization")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon /> New Organization
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
        </DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput
            control={form.control}
            name="name"
            label="Organization Name"
            placeholder="Acme Corp"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <InvoInput control={form.control} name="phone" label="Phone" placeholder="+880..." />
            <InvoInput control={form.control} name="email" label="Email" type="email" placeholder="info@acme.com" />
          </div>
          <InvoInput control={form.control} name="address" label="Address" placeholder="123 Main St, City" />
          <div className="grid grid-cols-2 gap-4">
            <InvoInput control={form.control} name="registerNumber" label="Register Number" placeholder="REG-12345" />
            <InvoInput control={form.control} name="gstNumber" label="GST Number" placeholder="GST-12345" />
          </div>
          <InvoInput
            control={form.control}
            name="invoicePrefix"
            label="Invoice Prefix"
            placeholder="INV"
            description="Default: INV. Max 6 characters."
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

// ─── Org Card ─────────────────────────────────────────────────────────────────

function OrgCard({ org }: { org: Organization }) {
  const navigate = useNavigate()
  const logoUrl = org.logo
    ? `${import.meta.env.VITE_API_URL}/uploads/${org.logo}`
    : null

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => navigate(`/org/${org.id}`)}
    >
      <CardHeader className="border-b">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={org.name}
              className="h-10 w-10 rounded-lg object-cover ring-1 ring-foreground/10"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0">
            <CardTitle className="truncate">{org.name}</CardTitle>
            <CardDescription className="truncate">
              {org.invoicePrefix}-{String(org.nextInvoiceNumber).padStart(4, "0")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        {org.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{org.phone}</span>
          </div>
        )}
        {org.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{org.email}</span>
          </div>
        )}
        {org.address && (
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{org.address}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="justify-between text-xs text-muted-foreground">
        <span>Created {new Date(org.createdAt).toLocaleDateString()}</span>
        <ChevronRight className="h-3.5 w-3.5" />
      </CardFooter>
    </Card>
  )
}

// ─── Organizations Page ────────────────────────────────────────────────────────

export default function OrganizationsPage() {
  useBreadcrumbs([{ label: "Dashboard", to: "/" }, { label: "Organizations" }])
  const { data, isLoading, isError } = useGetMyOrganizationsQuery()
  const orgs = data?.data ?? []

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Organizations</h1>
          <p className="text-sm text-muted-foreground">Manage your organizations</p>
        </div>
        <CreateOrgDialog />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl bg-destructive/10 px-4 py-8 text-center text-sm text-destructive">
          Failed to load organizations. Please try again.
        </div>
      )}

      {!isLoading && !isError && orgs.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <Building2 className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="font-medium">No organizations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first organization to get started.
          </p>
        </div>
      )}

      {!isLoading && !isError && orgs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((org) => (
            <OrgCard key={org.id} org={org} />
          ))}
        </div>
      )}
    </div>
  )
}
