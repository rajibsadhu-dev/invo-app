import httpStatus from "http-status";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";
import { ICreateCategory, IUpdateCategory, ICategoryQuery } from "./category.interface";

type CategoryRow = {
  id: number;
  parentId: number | null;
};

type CategoryNode<T extends CategoryRow> = T & { children: CategoryNode<T>[] };

/**
 * Verifies a parent category exists in this organization, and — when moving an existing
 * category — that the move does not put the category inside its own subtree. The
 * self-reference FK cannot express that: a cycle is valid SQL and an infinite tree walk.
 */
const assertParentIsUsable = async (
  organizationId: number,
  parentId: number,
  categoryId?: number
): Promise<void> => {
  if (categoryId && parentId === categoryId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "A category cannot be its own parent");
  }

  const parent = await prisma.productCategory.findFirst({
    where: { id: parentId, organizationId },
    select: { id: true, parentId: true },
  });
  if (!parent) {
    throw new ApiError(httpStatus.NOT_FOUND, "Parent category not found");
  }

  if (!categoryId) return;

  // Walk up from the new parent: meeting the category being moved means a cycle.
  let ancestorId = parent.parentId;
  while (ancestorId !== null) {
    if (ancestorId === categoryId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "A category cannot be moved inside one of its own subcategories"
      );
    }
    const ancestor = await prisma.productCategory.findUnique({
      where: { id: ancestorId },
      select: { parentId: true },
    });
    if (!ancestor) break;
    ancestorId = ancestor.parentId;
  }
};

/**
 * MySQL treats NULLs as distinct in a unique index, so the (organization, name, parent)
 * constraint does not stop two root categories sharing a name — parent_id is NULL for
 * both. Check explicitly, which also gives a clearer conflict than a raw P2002.
 */
const assertNameIsFree = async (
  organizationId: number,
  name: string,
  parentId: number | null,
  categoryId?: number
): Promise<void> => {
  const clash = await prisma.productCategory.findFirst({
    where: {
      organizationId,
      name,
      parentId,
      ...(categoryId ? { id: { not: categoryId } } : {}),
    },
    select: { id: true },
  });
  if (clash) {
    throw new ApiError(
      httpStatus.CONFLICT,
      parentId === null
        ? "A top-level category with this name already exists"
        : "A category with this name already exists under the same parent"
    );
  }
};

const buildTree = <T extends CategoryRow>(rows: T[]): CategoryNode<T>[] => {
  const nodes = new Map<number, CategoryNode<T>>();
  for (const row of rows) {
    nodes.set(row.id, { ...row, children: [] });
  }

  const roots: CategoryNode<T>[] = [];
  for (const row of rows) {
    const node = nodes.get(row.id)!;
    const parent = row.parentId === null ? undefined : nodes.get(row.parentId);
    if (parent) {
      parent.children.push(node);
    } else {
      // Includes categories whose parent sits outside this organization's rows — they
      // would otherwise vanish from the response entirely.
      roots.push(node);
    }
  }
  return roots;
};

const createCategory = async (organizationId: number, payload: ICreateCategory) => {
  if (payload.parentId) {
    await assertParentIsUsable(organizationId, payload.parentId);
  }
  await assertNameIsFree(organizationId, payload.name, payload.parentId ?? null);

  return prisma.productCategory.create({
    data: {
      ...payload,
      organizationId,
      description: payload.description || null,
      parentId: payload.parentId ?? null,
    },
  });
};

const getCategories = async (organizationId: number, query: ICategoryQuery) => {
  const categories = await prisma.productCategory.findMany({
    where: { organizationId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true, children: true } } },
  });

  if (query.tree === true || query.tree === "true") {
    return buildTree(categories);
  }
  return categories;
};

const getCategoryById = async (organizationId: number, categoryId: number) => {
  const category = await prisma.productCategory.findFirst({
    where: { id: categoryId, organizationId },
    include: {
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      _count: { select: { products: true } },
    },
  });
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }
  return category;
};

const updateCategory = async (
  organizationId: number,
  categoryId: number,
  payload: IUpdateCategory
) => {
  const existing = await getCategoryById(organizationId, categoryId);

  if (payload.parentId) {
    await assertParentIsUsable(organizationId, payload.parentId, categoryId);
  }

  // Either half of the (name, parent) pair moving can create a clash.
  if (payload.name !== undefined || payload.parentId !== undefined) {
    await assertNameIsFree(
      organizationId,
      payload.name ?? existing.name,
      payload.parentId !== undefined ? payload.parentId ?? null : existing.parentId,
      categoryId
    );
  }

  return prisma.productCategory.update({
    where: { id: categoryId },
    data: {
      ...payload,
      ...(payload.description !== undefined && {
        description: payload.description || null,
      }),
    },
  });
};

const deleteCategory = async (organizationId: number, categoryId: number) => {
  await getCategoryById(organizationId, categoryId);

  const [productCount, childCount] = await Promise.all([
    prisma.product.count({ where: { categoryId, organizationId } }),
    prisma.productCategory.count({ where: { parentId: categoryId } }),
  ]);

  if (productCount > 0) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `This category has ${productCount} product(s) and cannot be deleted`
    );
  }
  if (childCount > 0) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `This category has ${childCount} subcategory(ies) and cannot be deleted`
    );
  }

  return prisma.productCategory.delete({ where: { id: categoryId } });
};

export const CategoryService = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
