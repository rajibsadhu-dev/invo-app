import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { InvoForm } from "@/components/form"
import { useGetEstimateByIdQuery, useUpdateEstimateMutation } from "@/features/estimate/estimateApi"
import { useGetCustomersQuery } from "@/features/customer/customerApi"
import { useGetOrganizationByIdQuery, useGetInvoiceFieldConfigQuery } from "@/features/org/orgApi"
import { resolveFieldConfig } from "@/lib/invoiceFieldConfig"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import { EstimateFormFields } from "./EstimateFormFields"
import { estimateFormSchema, todayString, type EstimateFormValues } from "./estimateForm.schema"
import { getApiErrorMessage } from "@/lib/apiError"

export default function EditEstimatePage() {
  const { orgId, estimateId } = useParams<{ orgId: string; estimateId: string }>()
  const navigate = useNavigate()
  const oId = Number(orgId)
  const eId = Number(estimateId)

  const { data: orgData } = useGetOrganizationByIdQuery(oId)
  const org = orgData?.data

  const { data, isLoading, isError } = useGetEstimateByIdQuery({ orgId: oId, estimateId: eId })
  const estimate = data?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${oId}` },
    { label: "Estimates", to: `/org/${oId}/estimates` },
    { label: estimate?.estimateNumber ?? "Estimate", to: `/org/${oId}/estimates/${eId}` },
    { label: "Edit" },
  ])

  const { data: customersData } = useGetCustomersQuery({ orgId: oId, limit: 100 })
  const customers = customersData?.data ?? []

  const { data: fieldConfigData } = useGetInvoiceFieldConfigQuery(oId)
  const fieldConfig = resolveFieldConfig(org?.businessType, fieldConfigData?.data)

  const [updateEstimate, { isLoading: isSaving }] = useUpdateEstimateMutation()

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

  useEffect(() => {
    if (!estimate) return
    form.reset({
      customerId: estimate.customerId,
      estimateDate: estimate.estimateDate
        ? new Date(estimate.estimateDate).toISOString().split("T")[0]
        : todayString(),
      validUntil: estimate.validUntil
        ? new Date(estimate.validUntil).toISOString().split("T")[0]
        : "",
      items: (estimate.items ?? []).map((item) => ({
        productId: item.productId ?? null,
        productVariantId: item.productVariantId ?? null,
        description: item.description,
        hsnCode: item.hsnCode ?? "",
        unit: item.unit ?? "",
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        gstRate: Number(item.gstRate ?? 0),
      })),
      discount: Number(estimate.discount),
      challanNo: estimate.challanNo ?? "",
      vehicleNo: estimate.vehicleNo ?? "",
      siteLocation: estimate.siteLocation ?? "",
      billingAddress: estimate.billingAddress ?? "",
      referenceNumber: estimate.referenceNumber ?? "",
      termsAndConditions: estimate.termsAndConditions ?? "",
      notes: estimate.notes ?? "",
      authorizedSignatory: estimate.authorizedSignatory ?? "",
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimate?.id])

  const onSubmit = async (values: EstimateFormValues) => {
    try {
      await updateEstimate({
        orgId: oId,
        estimateId: eId,
        body: {
          customerId: values.customerId,
          estimateDate: values.estimateDate,
          validUntil: values.validUntil || null,
          items: values.items,
          discount: values.discount,
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
      toast.success("Estimate updated successfully")
      navigate(`/org/${oId}/estimates/${eId}`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update estimate"))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !estimate) {
    return (
      <div className="rounded-xl bg-destructive/10 px-4 py-8 text-center text-sm text-destructive">
        Estimate not found or access denied.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="font-heading text-xl font-semibold">Edit {estimate.estimateNumber}</h1>
        <p className="text-sm text-muted-foreground">Update estimate details</p>
      </div>
      <InvoForm form={form} onSubmit={onSubmit}>
        <EstimateFormFields
          form={form}
          orgId={oId}
          customers={customers}
          orgStateCode={org?.stateCode}
          fieldConfig={fieldConfig}
          isSubmitting={isSaving}
          submitLabel="Save Changes"
        />
      </InvoForm>
    </div>
  )
}
