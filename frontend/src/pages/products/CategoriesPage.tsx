import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import type { Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  PlusIcon,
  Pencil,
  Trash2,
  Loader2,
  FolderTree,
  CornerDownRight,
  ArrowLeft,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
import { InvoForm, InvoInput, InvoSelect, InvoTextarea } from "@/components/form"
import {
  useGetCategoryTreeQuery,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from "@/features/category/categoryApi"
import { useGetOrganizationByIdQuery } from "@/features/org/orgApi"
import { useBreadcrumbs } from "@/context/breadcrumbStore"
import { getApiErrorMessage } from "@/lib/apiError"
import type { ProductCategory, ProductCategoryNode } from "@/types"

const ROOT = "root"

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0),
})

type CategoryForm = z.infer<typeof categorySchema>

// ─── Form Dialog ──────────────────────────────────────────────────────────────

function CategoryFormDialog({
  orgId,
  categories,
  category,
  presetParentId,
  open,
  onOpenChange,
}: {
  orgId: number
  categories: ProductCategory[]
  /** Absent for a new category. */
  category?: ProductCategory
  /** Pre-selects a parent when adding a subcategory from a row action. */
  presetParentId?: number | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [createCategory, { isLoading: isCreating }] = useCreateCategoryMutation()
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation()
  const isEdit = !!category

  const form = useForm<CategoryForm>({
    // z.coerce widens the schema's input type; the form works in output types.
    resolver: zodResolver(categorySchema) as Resolver<CategoryForm>,
    defaultValues: category
      ? {
          name: category.name,
          description: category.description ?? "",
          parentId: category.parentId ? String(category.parentId) : ROOT,
          sortOrder: category.sortOrder,
        }
      : {
          name: "",
          description: "",
          parentId: presetParentId ? String(presetParentId) : ROOT,
          sortOrder: 0,
        },
  })

  // A category cannot be its own parent; the server also refuses its whole subtree.
  const parentOptions = [
    { value: ROOT, label: "No parent (top level)" },
    ...categories
      .filter((c) => c.id !== category?.id)
      .map((c) => ({ value: String(c.id), label: c.name })),
  ]

  const onSubmit = async (values: CategoryForm) => {
    const body = {
      name: values.name,
      description: values.description || null,
      parentId: values.parentId && values.parentId !== ROOT ? Number(values.parentId) : null,
      sortOrder: values.sortOrder,
    }
    try {
      if (category) {
        await updateCategory({ orgId, categoryId: category.id, body }).unwrap()
        toast.success("Category updated successfully")
      } else {
        await createCategory({ orgId, body }).unwrap()
        toast.success("Category created successfully")
        form.reset({ name: "", description: "", parentId: ROOT, sortOrder: 0 })
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, `Failed to ${isEdit ? "update" : "create"} category`)
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>
        <InvoForm form={form} onSubmit={onSubmit}>
          <InvoInput control={form.control} name="name" label="Name" required />
          <InvoSelect
            control={form.control}
            name="parentId"
            label="Parent Category"
            options={parentOptions}
          />
          <InvoTextarea control={form.control} name="description" label="Description" rows={2} />
          <InvoInput
            control={form.control}
            name="sortOrder"
            label="Sort Order"
            type="number"
            description="Lower numbers list first"
          />
          <DialogFooter className="mt-1">
            <Button type="submit" disabled={isCreating || isUpdating}>
              {(isCreating || isUpdating) && <Loader2 className="animate-spin" />}
              {isEdit ? "Save changes" : "Add Category"}
            </Button>
          </DialogFooter>
        </InvoForm>
      </DialogContent>
    </Dialog>
  )
}

// ─── Tree Row ─────────────────────────────────────────────────────────────────

function CategoryRow({
  node,
  depth,
  onEdit,
  onAddChild,
  onDelete,
  isDeleting,
}: {
  node: ProductCategoryNode
  depth: number
  onEdit: (c: ProductCategory) => void
  onAddChild: (parentId: number) => void
  onDelete: (id: number) => void
  isDeleting: boolean
}) {
  const productCount = node._count?.products ?? 0
  const childCount = node.children.length

  return (
    <>
      <div
        className="flex items-center gap-2 border-b px-3 py-2.5 last:border-b-0"
        style={{ paddingLeft: `${12 + depth * 22}px` }}
      >
        {depth > 0 && (
          <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{node.name}</p>
          {node.description && (
            <p className="truncate text-xs text-muted-foreground">{node.description}</p>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {productCount} product{productCount === 1 ? "" : "s"}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => onAddChild(node.id)}>
            <PlusIcon />
            <span className="sr-only">Add subcategory</span>
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(node)}>
            <Pencil />
            <span className="sr-only">Edit</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
              <Trash2 className="text-destructive" />
              <span className="sr-only">Delete</span>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete category?</AlertDialogTitle>
                <AlertDialogDescription>
                  {productCount > 0 || childCount > 0 ? (
                    <>
                      <strong>{node.name}</strong> still holds {productCount} product(s) and{" "}
                      {childCount} subcategory(ies). Move or remove them first — the server
                      will refuse this delete.
                    </>
                  ) : (
                    <>
                      <strong>{node.name}</strong> will be permanently deleted.
                    </>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={() => onDelete(node.id)}
                >
                  {isDeleting && <Loader2 className="animate-spin" />} Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {node.children.map((child) => (
        <CategoryRow
          key={child.id}
          node={child}
          depth={depth + 1}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      ))}
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const id = Number(orgId)

  const [addOpen, setAddOpen] = useState(false)
  const [presetParentId, setPresetParentId] = useState<number | null>(null)
  const [editCategory, setEditCategory] = useState<ProductCategory | null>(null)

  const { data: orgData } = useGetOrganizationByIdQuery(id)
  const org = orgData?.data

  useBreadcrumbs([
    { label: "Organizations", to: "/organizations" },
    { label: org?.name ?? "Organization", to: `/org/${id}` },
    { label: "Products", to: `/org/${id}/products` },
    { label: "Categories" },
  ])

  const { data: treeData, isLoading, isError } = useGetCategoryTreeQuery({ orgId: id })
  // The flat list feeds the parent picker: the tree would have to be walked to build it.
  const { data: flatData } = useGetCategoriesQuery({ orgId: id })

  const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation()

  const tree = treeData?.data ?? []
  const flat = flatData?.data ?? []

  const handleDelete = async (categoryId: number) => {
    try {
      await deleteCategory({ orgId: id, categoryId }).unwrap()
      toast.success("Category deleted")
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to delete category"))
    }
  }

  const openAdd = (parentId: number | null) => {
    setPresetParentId(parentId)
    setAddOpen(true)
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Product Categories</h1>
          <p className="text-sm text-muted-foreground">
            {flat.length} categor{flat.length === 1 ? "y" : "ies"} · nest them to any depth
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/org/${id}/products`)}
          >
            <ArrowLeft /> Products
          </Button>
          <Button size="sm" onClick={() => openAdd(null)}>
            <PlusIcon /> Add Category
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden">
        {isLoading && (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading categories…</p>
        )}
        {isError && (
          <p className="py-10 text-center text-sm text-destructive">Failed to load categories</p>
        )}
        {!isLoading && !isError && tree.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12">
            <FolderTree className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No categories yet</p>
          </div>
        )}
        {tree.map((node) => (
          <CategoryRow
            key={node.id}
            node={node}
            depth={0}
            onEdit={setEditCategory}
            onAddChild={openAdd}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        ))}
      </div>

      <CategoryFormDialog
        // Remount per parent: react-hook-form reads defaultValues only on mount, so the
        // preselected parent would otherwise stick at whatever the first open used.
        key={presetParentId ?? ROOT}
        orgId={id}
        categories={flat}
        presetParentId={presetParentId}
        open={addOpen}
        onOpenChange={(v) => {
          setAddOpen(v)
          if (!v) setPresetParentId(null)
        }}
      />
      {editCategory && (
        <CategoryFormDialog
          orgId={id}
          categories={flat}
          category={editCategory}
          open={!!editCategory}
          onOpenChange={(v) => {
            if (!v) setEditCategory(null)
          }}
        />
      )}
    </div>
  )
}
