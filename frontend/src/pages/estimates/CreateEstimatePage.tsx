import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { InvoForm } from "@/components/form"
import { useCreateEstimateMutation } from "@/features/estimate/estimateApi"
import { useGetCustomersQuery } from "@/features/customer/customerApi"
import { useGetOrganizationByIdQuery, useGetInvoiceFieldConfigQuery } from "@/features/org/orgApi"
import { resolveFieldConfig } from "@/lib/invoiceFieldConfig"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import { EstimateFormFields } from "./EstimateFormFields"
import { estimateFormSchema, todayString, type EstimateFormValues } from "./estimateForm.schema"
import { getApiErrorMessage } from "@/lib/apiError"

export default function CreateEstimatePage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const id = Number(orgId)

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Estimates", to: `/org/${id}/estimates` },
    { label: "New Estimate" },
  ])

  const { data: customersData } = useGetCustomersQuery({ orgId: id, limit: 100 })
  const customers = customersData?.data ?? []

  const { data: fieldConfigData } = useGetInvoiceFieldConfigQuery(id)
  const fieldConfig = resolveFieldConfig(org?.businessType, fieldConfigData?.data)

  const [createEstimate, { isLoading }] = useCreateEstimateMutation()

  const form = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema) as Resolver<EstimateFormValues>,
    defaultValues: {
      customerId: 0,
      estimateDate: todayString(),
      validUntil: "",
      items: [
        { productId: null, productVariantId: null, description: "", hsnCode: "", unit: "", quantity: 1, rate: 0, gstRate: 18 },
      ],
      discount: 0,
    },
  })

  const onSubmit = async (values: EstimateFormValues) => {
    try {
      const result = await createEstimate({
        orgId: id,
        body: {
          customerId: values.customerId,
          estimateDate: values.estimateDate,
          validUntil: values.validUntil || null,
          items: values.items,
          discount: values.discount || undefined,
          challanNo: values.challanNo || null,
          vehicleNo: values.vehicleNo || null,
          siteLocation: values.siteLocation || null,
          billingAddress: values.billingAddress || null,
          referenceNumber: values.referenceNumber || null,
          termsAndConditions: values.termsAndConditions || null,
          notes: values.notes || null,
          authorizedSignatory: values.authorizedSignatory || null,
        },
      }).unwrap()
      toast.success("Estimate created successfully")
      navigate(`/org/${id}/estimates/${result.data.id}`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create estimate"))
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-xl font-semibold">New Estimate</h1>
        <p className="text-sm text-muted-foreground">Create a new estimate for {org?.name}</p>
      </div>
      <InvoForm form={form} onSubmit={onSubmit}>
        <EstimateFormFields
          form={form}
          orgId={id}
          customers={customers}
          orgStateCode={org?.stateCode}
          fieldConfig={fieldConfig}
          isSubmitting={isLoading}
          submitLabel="Create Estimate"
        />
      </InvoForm>
    </div>
  )
}
