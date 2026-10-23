import httpStatus from "http-status";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";
import { ProductService } from "./product.service";
import {
  ICreateVariant,
  IUpdateVariant,
  IBulkGenerateVariants,
} from "./variant.interface";

const assertProductHasVariants = async (
  organizationId: number,
  productId: number
) => {
  const product = await ProductService.getProductById(organizationId, productId);
  if (!product.hasVariants) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "This product does not have variants enabled"
    );
  }
  return product;
};

const assertSkuIsFree = async (
  productId: number,
  sku: string,
  variantId?: number
): Promise<void> => {
  const clash = await prisma.productVariant.findFirst({
    where: {
      productId,
      sku,
      ...(variantId ? { id: { not: variantId } } : {}),
    },
    select: { id: true },
  });
  if (clash) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "A variant with this SKU already exists on this product"
    );
  }
};

const getVariants = async (organizationId: number, productId: number) => {
  await assertProductHasVariants(organizationId, productId);

  return prisma.productVariant.findMany({
    where: { productId },
    orderBy: { name: "asc" },
  });
};

const getVariantById = async (
  organizationId: number,
  productId: number,
  variantId: number
) => {
  await assertProductHasVariants(organizationId, productId);

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
    include: { _count: { select: { invoiceItems: true } } },
  });
  if (!variant) {
    throw new ApiError(httpStatus.NOT_FOUND, "Variant not found");
  }
  return variant;
};

const createVariant = async (
  organizationId: number,
  productId: number,
  payload: ICreateVariant
) => {
  await assertProductHasVariants(organizationId, productId);

  if (payload.sku) {
    await assertSkuIsFree(productId, payload.sku);
  }

  return prisma.productVariant.create({
    data: {
      productId,
      sku: payload.sku || null,
      name: payload.name,
      attributes: payload.attributes,
      sellingPrice: payload.sellingPrice ?? null,
      purchasePrice: payload.purchasePrice ?? null,
      isActive: payload.isActive ?? true,
    },
  });
};

const updateVariant = async (
  organizationId: number,
  productId: number,
  variantId: number,
  payload: IUpdateVariant
) => {
  await getVariantById(organizationId, productId, variantId);

  if (payload.sku) {
    await assertSkuIsFree(productId, payload.sku, variantId);
  }

  return prisma.productVariant.update({
    where: { id: variantId },
    data: {
      ...(payload.sku !== undefined && { sku: payload.sku || null }),
      ...(payload.name !== undefined && { name: payload.name }),
      ...(payload.sellingPrice !== undefined && {
        sellingPrice: payload.sellingPrice,
      }),
      ...(payload.purchasePrice !== undefined && {
        purchasePrice: payload.purchasePrice,
      }),
      ...(payload.isActive !== undefined && { isActive: payload.isActive }),
    },
  });
};

const deleteVariant = async (
  organizationId: number,
  productId: number,
  variantId: number
): Promise<{ deactivated: boolean }> => {
  const variant = await getVariantById(organizationId, productId, variantId);
  const usageCount = variant._count?.invoiceItems ?? 0;

  if (usageCount > 0) {
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { isActive: false },
    });
    return { deactivated: true };
  }

  await prisma.productVariant.delete({ where: { id: variantId } });
  return { deactivated: false };
};

/**
 * Generates all combinations from the given attribute → values map.
 * E.g. { Color: ["Red", "Blue"], Size: ["S", "M"] }
 * → [{ Color: "Red", Size: "S" }, { Color: "Red", Size: "M" }, ...]
 */
const bulkGenerate = async (
  organizationId: number,
  productId: number,
  payload: IBulkGenerateVariants
) => {
  await assertProductHasVariants(organizationId, productId);

  const combos = cartesian(payload.attributes);

  const existingVariants = await prisma.productVariant.findMany({
    where: { productId },
    select: { name: true },
  });
  const existingNames = new Set(existingVariants.map((v) => v.name));

  const toCreate = combos.filter((combo) => {
    const name = variantName(combo);
    return !existingNames.has(name);
  });

  if (toCreate.length === 0) {
    return { created: 0, skipped: combos.length };
  }

  await prisma.productVariant.createMany({
    data: toCreate.map((combo) => ({
      productId,
      name: variantName(combo),
      attributes: combo,
      isActive: true,
    })),
  });

  return { created: toCreate.length, skipped: combos.length - toCreate.length };
};

function variantName(combo: Record<string, string>): string {
  return Object.values(combo).join(" / ");
}

function cartesian(
  attrs: Record<string, string[]>
): Record<string, string>[] {
  const keys = Object.keys(attrs);
  if (keys.length === 0) return [];

  let result: Record<string, string>[] = [{}];
  for (const key of keys) {
    const expanded: Record<string, string>[] = [];
    for (const combo of result) {
      for (const value of attrs[key]) {
        expanded.push({ ...combo, [key]: value });
      }
    }
    result = expanded;
  }
  return result;
}

export const VariantService = {
  getVariants,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant,
  bulkGenerate,
};
