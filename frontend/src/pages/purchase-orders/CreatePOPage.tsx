import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { InvoForm } from "@/components/form"
import { useCreatePurchaseOrderMutation } from "@/features/purchase-order/purchaseOrderApi"
import { useGetSuppliersQuery } from "@/features/supplier/supplierApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import { POFormFields } from "./POFormFields"
import { poFormSchema, todayString, type POFormValues } from "./poForm.schema"
import { getApiErrorMessage } from "@/lib/apiError"

export default function CreatePOPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const id = Number(orgId)

  const preSelectedSupplier = Number(searchParams.get("supplierId")) || 0

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Purchase Orders", to: `/org/${id}/purchase-orders` },
    { label: "New PO" },
  ])

  const { data: suppliersData } = useGetSuppliersQuery({ orgId: id, limit: 100 })
  const suppliers = (suppliersData?.data ?? []).filter((s) => s.isActive)

  const [createPO, { isLoading }] = useCreatePurchaseOrderMutation()

  const form = useForm<POFormValues>({
    resolver: zodResolver(poFormSchema) as Resolver<POFormValues>,
    defaultValues: {
      supplierId: preSelectedSupplier,
      poDate: todayString(),
      expectedDate: "",
      notes: "",
      items: [
        {
          productId: null,
          productVariantId: null,
          description: "",
          hsnCode: "",
          unit: "",
          quantity: 1,
          rate: 0,
          gstRate: 18,
        },
      ],
    },
  })

  const onSubmit = async (values: POFormValues) => {
    try {
      const result = await createPO({
        orgId: id,
        body: {
          supplierId: values.supplierId,
          poDate: values.poDate,
          expectedDate: values.expectedDate || null,
          notes: values.notes || undefined,
          items: values.items.map((item) => ({
            productId: item.productId ?? 0,
            productVariantId: item.productVariantId ?? null,
            description: item.description,
            hsnCode: item.hsnCode || null,
            unit: item.unit || null,
            quantity: item.quantity,
            rate: item.rate,
            gstRate: item.gstRate,
          })),
        },
      }).unwrap()
      toast.success("Purchase order created")
      navigate(`/org/${id}/purchase-orders/${result.data.id}`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create purchase order"))
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-heading text-xl font-semibold mb-4">New Purchase Order</h1>
      <InvoForm form={form} onSubmit={onSubmit}>
        <POFormFields
          form={form}
          orgId={id}
          suppliers={suppliers}
          isSubmitting={isLoading}
          submitLabel="Create Purchase Order"
        />
      </InvoForm>
    </div>
  )
}
