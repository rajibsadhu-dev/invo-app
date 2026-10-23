import httpStatus from "http-status";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";
import { buildQuery, paginationMeta } from "@/helpers/queryBuilder";
import { ICreateSupplier, IUpdateSupplier, ISupplierQuery } from "./supplier.interface";

const FILTER_FIELDS = [
  "name",
  "email",
  "phone",
  "gstNumber",
  "stateCode",
  "isActive",
  "createdAt",
];

const SORT_FIELDS = ["name", "email", "createdAt", "updatedAt"];

const createSupplier = async (organizationId: number, payload: ICreateSupplier) => {
  return prisma.supplier.create({
    data: {
      ...payload,
      organizationId,
      email: payload.email || null,
      gstNumber: payload.gstNumber || null,
      stateCode: payload.stateCode || null,
      contactPerson: payload.contactPerson || null,
      notes: payload.notes || null,
    },
  });
};

const getSuppliers = async (organizationId: number, query: ISupplierQuery) => {
  const { search } = query;

  const baseWhere: Record<string, unknown> = {
    organizationId,
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
            { contactPerson: { contains: search } },
          ],
        }
      : {}),
  };

  const { where, orderBy, skip, take, page, limit } = buildQuery({
    filters: query.filters,
    sort: query.sort,
    page: query.page,
    limit: query.limit,
    allowedFields: FILTER_FIELDS,
    allowedSortFields: SORT_FIELDS,
    defaultSort: "createdAt",
    defaultOrder: "desc",
    baseWhere,
  });

  const [data, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy,
      skip,
      take,
      include: { _count: { select: { purchaseOrders: true } } },
    }),
    prisma.supplier.count({ where }),
  ]);

  return {
    data,
    meta: paginationMeta(total, page, limit),
  };
};

const getSupplierById = async (organizationId: number, supplierId: number) => {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId },
    include: { _count: { select: { purchaseOrders: true } } },
  });
  if (!supplier) {
    throw new ApiError(httpStatus.NOT_FOUND, "Supplier not found");
  }
  return supplier;
};

const updateSupplier = async (
  organizationId: number,
  supplierId: number,
  payload: IUpdateSupplier
) => {
  const existing = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Supplier not found");
  }

  return prisma.supplier.update({
    where: { id: supplierId },
    data: {
      ...payload,
      email: payload.email !== undefined ? payload.email || null : undefined,
      gstNumber: payload.gstNumber !== undefined ? payload.gstNumber || null : undefined,
      stateCode: payload.stateCode !== undefined ? payload.stateCode || null : undefined,
      contactPerson: payload.contactPerson !== undefined ? payload.contactPerson || null : undefined,
      notes: payload.notes !== undefined ? payload.notes || null : undefined,
    },
  });
};

const deleteSupplier = async (organizationId: number, supplierId: number) => {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, organizationId },
    include: { _count: { select: { purchaseOrders: true } } },
  });
  if (!supplier) {
    throw new ApiError(httpStatus.NOT_FOUND, "Supplier not found");
  }

  if (supplier._count.purchaseOrders > 0) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Cannot delete supplier with purchase orders. Deactivate instead."
    );
  }

  await prisma.supplier.delete({ where: { id: supplierId } });
};

const searchSuppliers = async (organizationId: number, q: string) => {
  return prisma.supplier.findMany({
    where: {
      organizationId,
      isActive: true,
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
        { contactPerson: { contains: q } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      gstNumber: true,
      stateCode: true,
      contactPerson: true,
    },
    take: 10,
    orderBy: { name: "asc" },
  });
};

export const SupplierService = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  searchSuppliers,
};
