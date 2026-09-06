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
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import { InvoiceFormFields } from "./InvoiceFormFields"
import { invoiceFormSchema, todayString, type InvoiceFormValues } from "./invoiceForm.schema"
import { getApiErrorMessage } from "@/lib/apiError"

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
  const customers = customersData?.data ?? []

  const [updateInvoice, { isLoading: isSaving }] = useUpdateInvoiceMutation()

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema) as Resolver<InvoiceFormValues>,
    defaultValues: {
      customerId: 0,
      invoiceDate: todayString(),
      items: [
        { description: "", hsnCode: "", unit: "", quantity: 1, rate: 0, gstRate: 18 },
      ],
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
        hsnCode: item.hsnCode ?? "",
        unit: item.unit ?? "",
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        gstRate: Number(item.gstRate ?? 0),
      })),
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
          // `tax` is not sent: the server derives it from each line's GST rate.
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
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update invoice"))
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
          customers={customers}
          orgStateCode={org?.stateCode}
          isSubmitting={isSaving}
          submitLabel="Save Changes"
        />
      </InvoForm>
    </div>
  )
}
