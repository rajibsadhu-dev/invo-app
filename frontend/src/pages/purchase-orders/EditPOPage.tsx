import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { InvoForm } from "@/components/form"
import {
  useGetPurchaseOrderByIdQuery,
  useUpdatePurchaseOrderMutation,
} from "@/features/purchase-order/purchaseOrderApi"
import { useGetSuppliersQuery } from "@/features/supplier/supplierApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import { POFormFields } from "./POFormFields"
import { poFormSchema, todayString, type POFormValues } from "./poForm.schema"
import { getApiErrorMessage } from "@/lib/apiError"

export default function EditPOPage() {
  const { orgId, poId } = useParams<{ orgId: string; poId: string }>()
  const navigate = useNavigate()
  const oId = Number(orgId)
  const pId = Number(poId)

  const { data: orgData } = useGetOrganizationByIdQuery(oId)
  const org = orgData?.data

  const { data, isLoading, isError } = useGetPurchaseOrderByIdQuery({ orgId: oId, poId: pId })
  const po = data?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${oId}` },
    { label: "Purchase Orders", to: `/org/${oId}/purchase-orders` },
    { label: po?.poNumber ?? "PO", to: `/org/${oId}/purchase-orders/${pId}` },
    { label: "Edit" },
  ])

  const { data: suppliersData } = useGetSuppliersQuery({ orgId: oId, limit: 100 })
  const suppliers = (suppliersData?.data ?? []).filter((s) => s.isActive)

  const [updatePO, { isLoading: isSaving }] = useUpdatePurchaseOrderMutation()

  const form = useForm<POFormValues>({
    resolver: zodResolver(poFormSchema) as Resolver<POFormValues>,
    defaultValues: {
      supplierId: 0,
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

  useEffect(() => {
    if (!po) return
    form.reset({
      supplierId: po.supplierId,
      poDate: po.poDate ? new Date(po.poDate).toISOString().split("T")[0] : todayString(),
      expectedDate: po.expectedDate
        ? new Date(po.expectedDate).toISOString().split("T")[0]
        : "",
      notes: po.notes ?? "",
      items: (po.items ?? []).map((item) => ({
        productId: item.productId ?? null,
        productVariantId: item.productVariantId ?? null,
        description: item.description,
        hsnCode: item.hsnCode ?? "",
        unit: item.unit ?? "",
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        gstRate: Number(item.gstRate ?? 0),
      })),
    })
  }, [po, form])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !po) {
    return (
      <div className="rounded-xl bg-destructive/10 px-4 py-8 text-center text-sm text-destructive">
        Purchase order not found or access denied.
      </div>
    )
  }

  if (po.status !== "draft") {
    return (
      <div className="rounded-xl bg-muted px-4 py-8 text-center text-sm text-muted-foreground">
        Only draft purchase orders can be edited. This PO is <strong>{po.status}</strong>.
      </div>
    )
  }

  const onSubmit = async (values: POFormValues) => {
    try {
      await updatePO({
        orgId: oId,
        poId: pId,
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
      toast.success("Purchase order updated")
      navigate(`/org/${oId}/purchase-orders/${pId}`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to update purchase order"))
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="font-heading text-xl font-semibold mb-4">
        Edit {po.poNumber}
      </h1>
      <InvoForm form={form} onSubmit={onSubmit}>
        <POFormFields
          form={form}
          orgId={oId}
          suppliers={suppliers}
          isSubmitting={isSaving}
          submitLabel="Save Changes"
        />
      </InvoForm>
    </div>
  )
}
