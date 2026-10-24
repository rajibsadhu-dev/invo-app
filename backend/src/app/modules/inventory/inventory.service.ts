import { Prisma } from "@prisma/client";
import httpStatus from "http-status";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";
import { paginationMeta } from "@/helpers/queryBuilder";
import type {
  IStockAdjust,
  IStockSet,
  IStockMovementQuery,
  StockMovementType,
} from "./inventory.interface";

const dec = (v: unknown): Prisma.Decimal =>
  v instanceof Prisma.Decimal ? v : new Prisma.Decimal(String(v));

// ─── Stock adjustment (relative) ────────────────────────────────────────────

const adjustStock = async (
  organizationId: number,
  productId: number,
  userId: number,
  payload: IStockAdjust
) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId },
    select: { id: true, hasVariants: true },
  });
  if (!product)
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");

  if (product.hasVariants && !payload.variantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This product has variants — specify variantId"
    );
  }

  if (payload.variantId) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: payload.variantId, productId },
      select: { id: true },
    });
    if (!variant)
      throw new ApiError(httpStatus.NOT_FOUND, "Variant not found");
  }

  return prisma.$transaction(async (tx) => {
    const movement = await tx.stockMovement.create({
      data: {
        organizationId,
        productId,
        productVariantId: payload.variantId ?? null,
        type: payload.type ?? "adjustment",
        quantity: new Prisma.Decimal(payload.quantity),
        notes: payload.notes ?? null,
        createdBy: userId,
      },
    });

    if (payload.variantId) {
      await tx.productVariant.update({
        where: { id: payload.variantId },
        data: {
          stockQuantity: { increment: new Prisma.Decimal(payload.quantity) },
        },
      });
    } else {
      await tx.product.update({
        where: { id: productId },
        data: {
          stockQuantity: { increment: new Prisma.Decimal(payload.quantity) },
        },
      });
    }

    return movement;
  });
};

// ─── Stock set (absolute) ───────────────────────────────────────────────────

const setStock = async (
  organizationId: number,
  productId: number,
  userId: number,
  payload: IStockSet
) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId },
    select: { id: true, hasVariants: true, stockQuantity: true },
  });
  if (!product)
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");

  if (product.hasVariants && !payload.variantId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This product has variants — specify variantId"
    );
  }

  let currentQty: Prisma.Decimal;

  if (payload.variantId) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: payload.variantId, productId },
      select: { id: true, stockQuantity: true },
    });
    if (!variant)
      throw new ApiError(httpStatus.NOT_FOUND, "Variant not found");
    currentQty = dec(variant.stockQuantity);
  } else {
    currentQty = dec(product.stockQuantity);
  }

  const target = new Prisma.Decimal(payload.quantity);
  const diff = target.sub(currentQty);

  if (diff.isZero()) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Stock is already at the specified quantity"
    );
  }

  return prisma.$transaction(async (tx) => {
    const movement = await tx.stockMovement.create({
      data: {
        organizationId,
        productId,
        productVariantId: payload.variantId ?? null,
        type: "adjustment",
        quantity: diff,
        notes: payload.notes
          ? `Set to ${payload.quantity}: ${payload.notes}`
          : `Set to ${payload.quantity}`,
        createdBy: userId,
      },
    });

    if (payload.variantId) {
      await tx.productVariant.update({
        where: { id: payload.variantId },
        data: { stockQuantity: target },
      });
    } else {
      await tx.product.update({
        where: { id: productId },
        data: { stockQuantity: target },
      });
    }

    return movement;
  });
};

// ─── Stock movement history ─────────────────────────────────────────────────

const getMovements = async (
  organizationId: number,
  query: IStockMovementQuery
) => {
  const { productId, variantId, type } = query;
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Prisma.StockMovementWhereInput = {
    organizationId,
    ...(productId ? { productId } : {}),
    ...(variantId ? { productVariantId: variantId } : {}),
    ...(type ? { type } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true, sku: true } },
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return { data, meta: paginationMeta(total, page, limit) };
};

const getProductMovements = async (
  organizationId: number,
  productId: number,
  query: IStockMovementQuery
) => {
  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId },
    select: { id: true },
  });
  if (!product)
    throw new ApiError(httpStatus.NOT_FOUND, "Product not found");

  return getMovements(organizationId, { ...query, productId });
};

// ─── Invoice stock deduction ────────────────────────────────────────────────

/**
 * Deduct stock for every catalogue line on an invoice. Creates one StockMovement
 * per line item that references a product. The caller must supply the invoice items
 * (with product/variant ids and quantities).
 */
const deductStockForInvoice = async (
  tx: Prisma.TransactionClient,
  organizationId: number,
  invoiceId: number,
  items: Array<{
    productId: number | null;
    productVariantId: number | null;
    quantity: Prisma.Decimal;
  }>,
  userId: number
) => {
  for (const item of items) {
    if (!item.productId) continue;

    const qty = dec(item.quantity);

    await tx.stockMovement.create({
      data: {
        organizationId,
        productId: item.productId,
        productVariantId: item.productVariantId,
        type: "sale",
        quantity: qty.neg(),
        referenceType: "invoice",
        referenceId: invoiceId,
        createdBy: userId,
      },
    });

    if (item.productVariantId) {
      await tx.productVariant.update({
        where: { id: item.productVariantId },
        data: { stockQuantity: { decrement: qty } },
      });
    } else {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { decrement: qty } },
      });
    }
  }
};

/**
 * Reverse a prior stock deduction when an invoice is cancelled.
 * Finds all sale movements for this invoice and creates offsetting entries.
 */
const reverseStockForInvoice = async (
  tx: Prisma.TransactionClient,
  organizationId: number,
  invoiceId: number,
  userId: number
) => {
  const movements = await tx.stockMovement.findMany({
    where: {
      organizationId,
      referenceType: "invoice",
      referenceId: invoiceId,
      type: "sale",
    },
  });

  for (const m of movements) {
    const returnQty = dec(m.quantity).neg(); // original is negative, so this is positive

    await tx.stockMovement.create({
      data: {
        organizationId,
        productId: m.productId,
        productVariantId: m.productVariantId,
        type: "return",
        quantity: returnQty,
        referenceType: "invoice",
        referenceId: invoiceId,
        notes: "Invoice cancelled — stock reversed",
        createdBy: userId,
      },
    });

    if (m.productVariantId) {
      await tx.productVariant.update({
        where: { id: m.productVariantId },
        data: { stockQuantity: { increment: returnQty } },
      });
    } else {
      await tx.product.update({
        where: { id: m.productId },
        data: { stockQuantity: { increment: returnQty } },
      });
    }
  }
};

// ─── Low-stock alerts ───────────────────────────────────────────────────────

const getLowStock = async (organizationId: number) => {
  const [products, variants] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        id: number;
        name: string;
        sku: string | null;
        stock_quantity: string;
        low_stock_alert: string;
      }>
    >`
      SELECT id, name, sku, stock_quantity, low_stock_alert
      FROM products
      WHERE organization_id = ${organizationId}
        AND is_active = 1
        AND has_variants = 0
        AND low_stock_alert IS NOT NULL
        AND stock_quantity <= low_stock_alert
      ORDER BY name
    `,
    prisma.$queryRaw<
      Array<{
        id: number;
        product_id: number;
        productName: string;
        name: string;
        sku: string | null;
        stock_quantity: string;
        low_stock_alert: string;
      }>
    >`
      SELECT pv.id, pv.product_id, p.name AS productName, pv.name, pv.sku,
             pv.stock_quantity, pv.low_stock_alert
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE p.organization_id = ${organizationId}
        AND p.is_active = 1
        AND pv.is_active = 1
        AND pv.low_stock_alert IS NOT NULL
        AND pv.stock_quantity <= pv.low_stock_alert
      ORDER BY p.name, pv.name
    `,
  ]);

  return {
    products: products.map((p) => ({
      type: "product" as const,
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQuantity: p.stock_quantity,
      lowStockAlert: p.low_stock_alert,
    })),
    variants: variants.map((v) => ({
      type: "variant" as const,
      id: v.id,
      productId: v.product_id,
      productName: v.productName,
      name: v.name,
      sku: v.sku,
      stockQuantity: v.stock_quantity,
      lowStockAlert: v.low_stock_alert,
    })),
    totalCount: products.length + variants.length,
  };
};

// ─── Inventory summary ──────────────────────────────────────────────────────

const getSummary = async (organizationId: number) => {
  const [productAgg, variantAgg, lowStock, categoryBreakdown] =
    await Promise.all([
      prisma.product.aggregate({
        where: { organizationId, isActive: true, hasVariants: false },
        _count: true,
        _sum: { stockQuantity: true },
      }),
      prisma.productVariant.aggregate({
        where: {
          product: { organizationId, isActive: true, hasVariants: true },
          isActive: true,
        },
        _count: true,
        _sum: { stockQuantity: true },
      }),
      getLowStock(organizationId),
      prisma.product.groupBy({
        by: ["categoryId"],
        where: { organizationId, isActive: true },
        _count: true,
      }),
    ]);

  const categoryIds = categoryBreakdown
    .map((c) => c.categoryId)
    .filter((id): id is number => id !== null);

  const categories =
    categoryIds.length > 0
      ? await prisma.productCategory.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  return {
    totalProducts: (productAgg._count ?? 0) + (variantAgg._count ?? 0),
    totalProductStock: dec(productAgg._sum.stockQuantity ?? 0),
    totalVariantStock: dec(variantAgg._sum.stockQuantity ?? 0),
    lowStockCount: lowStock.totalCount,
    byCategory: categoryBreakdown.map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryId
        ? categoryMap.get(c.categoryId) ?? "Unknown"
        : "Uncategorized",
      productCount: c._count,
    })),
  };
};

// ─── Inventory valuation ───────────────────────────────────────────────────

const getValuation = async (organizationId: number) => {
  const [products, variants] = await Promise.all([
    prisma.$queryRaw<
      Array<{
        total_value: string | null;
        total_items: string;
        total_stock: string;
      }>
    >`
      SELECT
        SUM(stock_quantity * COALESCE(purchase_price, selling_price)) AS total_value,
        COUNT(*) AS total_items,
        SUM(stock_quantity) AS total_stock
      FROM products
      WHERE organization_id = ${organizationId}
        AND is_active = 1
        AND has_variants = 0
        AND stock_quantity > 0
    `,
    prisma.$queryRaw<
      Array<{
        total_value: string | null;
        total_items: string;
        total_stock: string;
      }>
    >`
      SELECT
        SUM(pv.stock_quantity * COALESCE(pv.purchase_price, pv.selling_price, p.purchase_price, p.selling_price)) AS total_value,
        COUNT(*) AS total_items,
        SUM(pv.stock_quantity) AS total_stock
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE p.organization_id = ${organizationId}
        AND p.is_active = 1
        AND pv.is_active = 1
        AND pv.stock_quantity > 0
    `,
  ]);

  const prodVal = Number(products[0]?.total_value ?? 0);
  const varVal = Number(variants[0]?.total_value ?? 0);

  return {
    totalValue: (prodVal + varVal).toFixed(2),
    productValue: prodVal.toFixed(2),
    variantValue: varVal.toFixed(2),
    productItems: Number(products[0]?.total_items ?? 0),
    variantItems: Number(variants[0]?.total_items ?? 0),
    productStock: Number(products[0]?.total_stock ?? 0).toFixed(3),
    variantStock: Number(variants[0]?.total_stock ?? 0).toFixed(3),
  };
};

export const InventoryService = {
  adjustStock,
  setStock,
  getMovements,
  getProductMovements,
  deductStockForInvoice,
  reverseStockForInvoice,
  getLowStock,
  getSummary,
  getValuation,
};
