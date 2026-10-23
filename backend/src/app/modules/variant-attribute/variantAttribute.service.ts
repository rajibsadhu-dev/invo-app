import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";
import {
  ICreateVariantAttribute,
  IUpdateVariantAttribute,
} from "./variantAttribute.interface";

const createAttribute = async (
  organizationId: number,
  payload: ICreateVariantAttribute
) => {
  const existing = await prisma.variantAttribute.findUnique({
    where: { organizationId_name: { organizationId, name: payload.name } },
    select: { id: true },
  });
  if (existing) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `An attribute named "${payload.name}" already exists`
    );
  }

  return prisma.variantAttribute.create({
    data: {
      organizationId,
      name: payload.name,
      values: dedupe(payload.values),
    },
  });
};

const getAttributes = async (organizationId: number) => {
  return prisma.variantAttribute.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });
};

const getAttributeById = async (organizationId: number, attributeId: number) => {
  const attr = await prisma.variantAttribute.findFirst({
    where: { id: attributeId, organizationId },
  });
  if (!attr) {
    throw new ApiError(httpStatus.NOT_FOUND, "Variant attribute not found");
  }
  return attr;
};

const updateAttribute = async (
  organizationId: number,
  attributeId: number,
  payload: IUpdateVariantAttribute
) => {
  await getAttributeById(organizationId, attributeId);

  if (payload.name) {
    const clash = await prisma.variantAttribute.findFirst({
      where: {
        organizationId,
        name: payload.name,
        id: { not: attributeId },
      },
      select: { id: true },
    });
    if (clash) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `An attribute named "${payload.name}" already exists`
      );
    }
  }

  return prisma.variantAttribute.update({
    where: { id: attributeId },
    data: {
      ...(payload.name !== undefined && { name: payload.name }),
      ...(payload.values !== undefined && { values: dedupe(payload.values) }),
    },
  });
};

const deleteAttribute = async (
  organizationId: number,
  attributeId: number
) => {
  const attr = await getAttributeById(organizationId, attributeId);

  const rows = await prisma.$queryRaw<[{ cnt: bigint }]>(
    Prisma.sql`
      SELECT COUNT(*) AS cnt
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      WHERE p.organization_id = ${organizationId}
        AND JSON_CONTAINS_PATH(pv.attributes, 'one', CONCAT('$.', ${attr.name}))
    `
  );
  const usageCount = Number(rows[0].cnt);

  if (usageCount > 0) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `Cannot delete "${attr.name}" — it is used by ${usageCount} variant${usageCount === 1 ? "" : "s"}`
    );
  }

  await prisma.variantAttribute.delete({ where: { id: attributeId } });
};

function dedupe(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

export const VariantAttributeService = {
  createAttribute,
  getAttributes,
  getAttributeById,
  updateAttribute,
  deleteAttribute,
};
