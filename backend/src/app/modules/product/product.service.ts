import httpStatus from "http-status";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";
import { buildQuery, paginationMeta } from "@/helpers/queryBuilder";
import { ICreateProduct, IUpdateProduct, IProductQuery } from "./product.interface";

const PRODUCT_FILTER_FIELDS = [
  "name",
  "sku",
  "hsnCode",
  "unit",
  "categoryId",
  "sellingPrice",
  "purchasePrice",
  "gstRate",
  "createdAt",
];

const PRODUCT_SORT_FIELDS = [
  "name",
  "sku",
  "sellingPrice",
  "purchasePrice",
  "gstRate",
  "createdAt",
  "updatedAt",
];

/** Fields the invoice/PO-form picker needs to auto-fill a line. */
const PICKER_SELECT = {
  id: true,
  name: true,
  sku: true,
  hsnCode: true,
  unit: true,
  sellingPrice: true,
  purchasePrice: true,
  gstRate: true,
  hasVariants: true,
  stockQuantity: true,
} as const;

const PICKER_RESULT_LIMIT = 10;

const assertCategoryInOrg = async (
  organizationId: number,
  categoryId: number
): Promise<void> => {
  const category = await prisma.productCategory.findFirst({
    where: { id: categoryId, organizationId },
    select: { id: true },
  });
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, "Category not found");
  }
};

/**
 * SKUs are unique per organization at the database level; checking first turns the
 * constraint violation into a message that names the actual problem.
 */
const assertSkuIsFree = async (
  organizationId: number,
  sku: string,
  productId?: number
): Promise<void> => {
  const clash = await prisma.product.findFirst({
    where: {
      organizationId,
      sku,
      ...(productId ? { id: { not: productId } } : {}),
    },
    select: { id: true },
  });
  if (clash) {
    throw new ApiError(httpStatus.CONFLICT, "A product with this SKU already exists");
  }
};

const createProduct = async (organizationId: number, payload: ICreateProduct) => {
  if (payload.categoryId) {
    await assertCategoryInOrg(organizationId, payload.categoryId);
  }
  if (payload.sku) {
    await assertSkuIsFree(organizationId, payload.sku);
  }

  return prisma.product.create({
    data: {
      ...payload,
      organizationId,
      // Empty strings would occupy the unique (organization, sku) slot and collide with
      // every other product left without a SKU. NULLs do not collide in MySQL.
      sku: payload.sku || null,
      description: payload.description || null,
      hsnCode: payload.hsnCode || null,
      unit: payload.unit || null,
      categoryId: payload.categoryId ?? null,
    },
    include: { category: { select: { id: true, name: true } } },
  });
};

const getProducts = async (organizationId: number, query: IProductQuery) => {
  const { search, categoryId, isActive } = query;

  const baseWhere: Record<string, unknown> = {
    organizationId,
    ...(categoryId ? { categoryId: Number(categoryId) } : {}),
    ...(isActive === undefined || isActive === ""
      ? {}
      : { isActive: isActive === true || isActive === "true" }),
    ...(search
      ? {
          OR: [{ name: { contains: search } }, { sku: { contains: search } }],
        }
      : {}),
  };

  const { where, orderBy, skip, take, page, limit } = buildQuery({
    filters: query.filters,
    sort: query.sort,
    page: query.page,
    limit: query.limit,
    allowedFields: PRODUCT_FILTER_FIELDS,
    allowedSortFields: PRODUCT_SORT_FIELDS,
    defaultSort: "name",
    defaultOrder: "asc",
    baseWhere,
  });

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { category: { select: { id: true, name: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data,
    meta: paginationMeta(total, page, limit),
  };
};

/**
 * Lightweight lookup for the invoice form's product picker: active products only,
 * matched on name or SKU, capped at ten rows and trimmed to the fields the form fills in.
 * Products with variants include their active variants so the form can show a variant
 * picker without a second round-trip.
 */
const searchProducts = async (organizationId: number, term?: string) => {
  const search = term?.trim();

  return prisma.product.findMany({
    where: {
      organizationId,
      isActive: true,
      ...(search
        ? { OR: [{ name: { contains: search } }, { sku: { contains: search } }] }
        : {}),
    },
    select: {
      ...PICKER_SELECT,
      variants: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          sku: true,
          sellingPrice: true,
          purchasePrice: true,
          attributes: true,
          stockQuantity: true,
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
    take: PICKER_RESULT_LIMIT,
  });
};

const getProductById = async (organizationId: number, productId: number) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId },
    include: {
      category: { select: { id: true, name: true } },
      variants: { orderBy: { name: "asc" } },
      _count: { select: { invoiceItems: true, variants: true } },
    },
  });
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");
  }
  return product;
};

const updateProduct = async (
  organizationId: number,
  productId: number,
  payload: IUpdateProduct
) => {
  await getProductById(organizationId, productId);

  if (payload.categoryId) {
    await assertCategoryInOrg(organizationId, payload.categoryId);
  }
  if (payload.sku) {
    await assertSkuIsFree(organizationId, payload.sku, productId);
  }

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...payload,
      ...(payload.sku !== undefined && { sku: payload.sku || null }),
      ...(payload.description !== undefined && {
        description: payload.description || null,
      }),
      ...(payload.hsnCode !== undefined && { hsnCode: payload.hsnCode || null }),
      ...(payload.unit !== undefined && { unit: payload.unit || null }),
    },
    include: { category: { select: { id: true, name: true } } },
  });
};

/**
 * A product that has been invoiced is deactivated rather than destroyed: the invoice
 * lines that reference it are part of a financial record. Untouched products are removed
 * outright. Returns whether the product was deactivated so the caller can say which.
 */
const deleteProduct = async (
  organizationId: number,
  productId: number
): Promise<{ deactivated: boolean }> => {
  await getProductById(organizationId, productId);

  const usageCount = await prisma.invoiceItem.count({ where: { productId } });

  if (usageCount > 0) {
    await prisma.product.update({
      where: { id: productId },
      data: { isActive: false },
    });
    return { deactivated: true };
  }

  await prisma.product.delete({ where: { id: productId } });
  return { deactivated: false };
};

export const ProductService = {
  createProduct,
  getProducts,
  searchProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
