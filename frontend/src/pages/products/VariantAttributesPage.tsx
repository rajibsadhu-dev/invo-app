import { useState } from "react"
import { useParams } from "react-router-dom"
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  useGetVariantAttributesQuery,
  useCreateVariantAttributeMutation,
  useUpdateVariantAttributeMutation,
  useDeleteVariantAttributeMutation,
} from "@/features/variant-attribute/variantAttributeApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import { getApiErrorMessage } from "@/lib/apiError"
import type { VariantAttribute } from "@/types"

export default function VariantAttributesPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const id = Number(orgId)

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  const { data, isLoading } = useGetVariantAttributesQuery({ orgId: id })
  const attributes = data?.data ?? []

  const [addOpen, setAddOpen] = useState(false)
  const [editAttr, setEditAttr] = useState<VariantAttribute | null>(null)

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Products", to: `/org/${id}/products` },
    { label: "Variant Attributes" },
  ])

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Variant Attributes</h1>
          <p className="text-sm text-muted-foreground">
            Define attributes like Size, Color, or Material. Use these to generate product variants.
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Attribute
        </Button>
      </div>

      {isLoading && (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
      )}

      {!isLoading && attributes.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No variant attributes yet. Add one to start creating product variants.
        </p>
      )}

      {attributes.length > 0 && (
        <AttributeTable
          orgId={id}
          attributes={attributes}
          onEdit={setEditAttr}
        />
      )}

      {addOpen && (
        <AttributeFormDialog
          orgId={id}
          open={addOpen}
          onOpenChange={setAddOpen}
        />
      )}

      {editAttr && (
        <AttributeFormDialog
          orgId={id}
          attribute={editAttr}
          open={!!editAttr}
          onOpenChange={(v) => { if (!v) setEditAttr(null) }}
        />
      )}
    </div>
  )
}

function AttributeTable({
  orgId,
  attributes,
  onEdit,
}: {
  orgId: number
  attributes: VariantAttribute[]
  onEdit: (a: VariantAttribute) => void
}) {
  const [deleteAttr, { isLoading }] = useDeleteVariantAttributeMutation()

  const handleDelete = async (attr: VariantAttribute) => {
    try {
      await deleteAttr({ orgId, attributeId: attr.id }).unwrap()
      toast.success(`"${attr.name}" deleted`)
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete attribute"))
    }
  }

  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Values</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {attributes.map((attr) => (
            <TableRow key={attr.id}>
              <TableCell className="font-medium">{attr.name}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(attr.values as string[]).map((v) => (
                    <Badge key={v} variant="outline" className="text-xs">
                      {v}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(attr)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    disabled={isLoading}
                    onClick={() => handleDelete(attr)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function AttributeFormDialog({
  orgId,
  attribute,
  open,
  onOpenChange,
}: {
  orgId: number
  attribute?: VariantAttribute
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const isEdit = !!attribute
  const [createAttr, { isLoading: isCreating }] = useCreateVariantAttributeMutation()
  const [updateAttr, { isLoading: isUpdating }] = useUpdateVariantAttributeMutation()

  const [name, setName] = useState(attribute?.name ?? "")
  const [values, setValues] = useState<string[]>(
    attribute ? (attribute.values as string[]) : []
  )
  const [newValue, setNewValue] = useState("")

  const addValue = () => {
    const trimmed = newValue.trim()
    if (!trimmed || values.includes(trimmed)) return
    setValues([...values, trimmed])
    setNewValue("")
  }

  const removeValue = (v: string) => {
    setValues(values.filter((val) => val !== v))
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Attribute name is required")
      return
    }
    if (values.length === 0) {
      toast.error("At least one value is required")
      return
    }

    try {
      if (attribute) {
        await updateAttr({
          orgId,
          attributeId: attribute.id,
          body: { name: name.trim(), values },
        }).unwrap()
        toast.success("Attribute updated")
      } else {
        await createAttr({
          orgId,
          body: { name: name.trim(), values },
        }).unwrap()
        toast.success("Attribute created")
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, `Failed to ${isEdit ? "update" : "create"} attribute`))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Attribute" : "Add Attribute"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label className="text-xs">Attribute Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Size, Color, Material"
            />
          </div>
          <div>
            <Label className="text-xs">Values</Label>
            <div className="flex gap-2">
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Add a value"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addValue()
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addValue}>
                Add
              </Button>
            </div>
            {values.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {values.map((v) => (
                  <Badge key={v} variant="secondary" className="gap-1 pr-1">
                    {v}
                    <button
                      type="button"
                      className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"
                      onClick={() => removeValue(v)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="mt-1">
          <Button onClick={handleSubmit} disabled={isCreating || isUpdating}>
            {(isCreating || isUpdating) && <Loader2 className="animate-spin mr-1.5" />}
            {isEdit ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
