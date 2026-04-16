import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { InvoForm } from "@/components/form"
import { useGetInvoiceByIdQuery, useUpdateInvoiceMutation } from "@/features/invoice/invoiceApi"
import { useGetCustomersQuery } from "@/features/customer/customerApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/BreadcrumbContext"
import { InvoiceFormFields, invoiceFormSchema, todayString, type InvoiceFormValues } from "./InvoiceFormFields"

export default function EditInvoicePage() {
  const { orgId, invoiceId } = useParams<{ orgId: string; invoiceId: string }>()
  const navigate = useNavigate()
  const oId = Number(orgId)
  const iId = Number(invoiceId)

  const { data: orgData } = useGetOrganizationByIdQuery(oId)
  const org = orgData?.data

  const { data, isLoading, isError } = useGetInvoiceByIdQuery({ orgId: oId, invoiceId: iId })
  const invoice = data?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${oId}` },
    { label: "Invoices", to: `/org/${oId}/invoices` },
    { label: invoice?.invoiceNumber ?? "Invoice", to: `/org/${oId}/invoices/${iId}` },
    { label: "Edit" },
  ])

  const { data: customersData } = useGetCustomersQuery({ orgId: oId, limit: 100 })
  const customerOptions = (customersData?.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }))

  const [updateInvoice, { isLoading: isSaving }] = useUpdateInvoiceMutation()

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema) as Resolver<InvoiceFormValues>,
    defaultValues: {
      customerId: 0,
      invoiceDate: todayString(),
      items: [{ description: "", unit: "", quantity: 1, rate: 0 }],
      tax: 0,
      discount: 0,
      receivedAmount: 0,
      paymentMethod: null,
    },
  })

  useEffect(() => {
    if (!invoice) return
    form.reset({
      customerId: invoice.customerId,
      invoiceDate: invoice.invoiceDate
        ? new Date(invoice.invoiceDate).toISOString().split("T")[0]
        : todayString(),
      items: (invoice.items ?? []).map((item) => ({
        description: item.description,
        unit: item.unit ?? "",
        quantity: Number(item.quantity),
        rate: Number(item.rate),
      })),
      tax: Number(invoice.tax),
      discount: Number(invoice.discount),
      receivedAmount: Number(invoice.receivedAmount),
      challanNo: invoice.challanNo ?? "",
      vehicleNo: invoice.vehicleNo ?? "",
      siteLocation: invoice.siteLocation ?? "",
      billingAddress: invoice.billingAddress ?? "",
      referenceNumber: invoice.referenceNumber ?? "",
      paymentMethod: invoice.paymentMethod ?? null,
      bankName: invoice.bankName ?? "",
      bankAccount: invoice.bankAccount ?? "",
      bankIfsc: invoice.bankIfsc ?? "",
      transactionNumber: invoice.transactionNumber ?? "",
      termsAndConditions: invoice.termsAndConditions ?? "",
      notes: invoice.notes ?? "",
      authorizedSignatory: invoice.authorizedSignatory ?? "",
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id])

  const onSubmit = async (values: InvoiceFormValues) => {
    try {
      await updateInvoice({
        orgId: oId,
        invoiceId: iId,
        body: {
          customerId: values.customerId,
          invoiceDate: values.invoiceDate,
          items: values.items,
          tax: values.tax,
          discount: values.discount,
          receivedAmount: values.receivedAmount,
          challanNo: values.challanNo || null,
          vehicleNo: values.vehicleNo || null,
          siteLocation: values.siteLocation || null,
          billingAddress: values.billingAddress || null,
          referenceNumber: values.referenceNumber || null,
          paymentMethod: values.paymentMethod ?? null,
          bankName: values.bankName || null,
          bankAccount: values.bankAccount || null,
          bankIfsc: values.bankIfsc || null,
          transactionNumber: values.transactionNumber || null,
          termsAndConditions: values.termsAndConditions || null,
          notes: values.notes || null,
          authorizedSignatory: values.authorizedSignatory || null,
        },
      }).unwrap()
      toast.success("Invoice updated successfully")
      navigate(`/org/${oId}/invoices/${iId}`)
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update invoice")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !invoice) {
    return (
      <div className="rounded-xl bg-destructive/10 px-4 py-8 text-center text-sm text-destructive">
        Invoice not found or access denied.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-xl font-semibold">Edit {invoice.invoiceNumber}</h1>
        <p className="text-sm text-muted-foreground">Update invoice details</p>
      </div>
      <InvoForm form={form} onSubmit={onSubmit}>
        <InvoiceFormFields
          form={form}
          customerOptions={customerOptions}
          isSubmitting={isSaving}
          submitLabel="Save Changes"
        />
      </InvoForm>
    </div>
  )
}
