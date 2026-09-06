import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { InvoForm } from "@/components/form"
import { useCreateInvoiceMutation } from "@/features/invoice/invoiceApi"
import { useGetCustomersQuery } from "@/features/customer/customerApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import { InvoiceFormFields } from "./InvoiceFormFields"
import { invoiceFormSchema, todayString, type InvoiceFormValues } from "./invoiceForm.schema"
import { getApiErrorMessage } from "@/lib/apiError"

export default function CreateInvoicePage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const id = Number(orgId)

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Invoices", to: `/org/${id}/invoices` },
    { label: "New Invoice" },
  ])

  const { data: customersData } = useGetCustomersQuery({ orgId: id, limit: 100 })
  const customers = customersData?.data ?? []

  const [createInvoice, { isLoading }] = useCreateInvoiceMutation()

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

  const onSubmit = async (values: InvoiceFormValues) => {
    try {
      const result = await createInvoice({
        orgId: id,
        body: {
          customerId: values.customerId,
          invoiceDate: values.invoiceDate,
          items: values.items,
          // `tax` is not sent: the server derives it from each line's GST rate.
          discount: values.discount || undefined,
          receivedAmount: values.receivedAmount || undefined,
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
      toast.success("Invoice created successfully")
      navigate(`/org/${id}/invoices/${result.data.id}`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create invoice"))
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-xl font-semibold">New Invoice</h1>
        <p className="text-sm text-muted-foreground">Create a new invoice for {org?.name}</p>
      </div>
      <InvoForm form={form} onSubmit={onSubmit}>
        <InvoiceFormFields
          form={form}
          customers={customers}
          orgStateCode={org?.stateCode}
          isSubmitting={isLoading}
          submitLabel="Create Invoice"
        />
      </InvoForm>
    </div>
  )
}
