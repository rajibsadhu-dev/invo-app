import httpStatus from "http-status";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";
import { buildQuery, paginationMeta } from "@/helpers/queryBuilder";
import { ICreateCustomer, IUpdateCustomer, ICustomerQuery } from "./customer.interface";

const CUSTOMER_FILTER_FIELDS = [
  "name",
  "email",
  "phone",
  "address",
  "gstNumber",
  "stateCode",
  "createdAt",
];

const CUSTOMER_SORT_FIELDS = [
  "name",
  "email",
  "phone",
  "createdAt",
  "updatedAt",
];

const createCustomer = async (organizationId: number, payload: ICreateCustomer) => {
  return prisma.customer.create({
    data: {
      ...payload,
      organizationId,
      email: payload.email || null,
    },
  });
};

const getCustomers = async (organizationId: number, query: ICustomerQuery) => {
  const { search } = query;

  const baseWhere: Record<string, unknown> = {
    organizationId,
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };

  const { where, orderBy, skip, take, page, limit } = buildQuery({
    filters: query.filters,
    sort: query.sort,
    page: query.page,
    limit: query.limit,
    allowedFields: CUSTOMER_FILTER_FIELDS,
    allowedSortFields: CUSTOMER_SORT_FIELDS,
    defaultSort: "createdAt",
    defaultOrder: "desc",
    baseWhere,
  });

  const [data, total] = await Promise.all([
    prisma.customer.findMany({ where, orderBy, skip, take }),
    prisma.customer.count({ where }),
  ]);

  return {
    data,
    meta: paginationMeta(total, page, limit),
  };
};

const getCustomerById = async (organizationId: number, customerId: number) => {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, organizationId },
  });
  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");
  }
  return customer;
};

const updateCustomer = async (
  organizationId: number,
  customerId: number,
  payload: IUpdateCustomer
) => {
  await getCustomerById(organizationId, customerId);

  return prisma.customer.update({
    where: { id: customerId },
    data: {
      ...payload,
      ...(payload.email !== undefined && { email: payload.email || null }),
    },
  });
};

const deleteCustomer = async (organizationId: number, customerId: number) => {
  await getCustomerById(organizationId, customerId);

  const invoiceCount = await prisma.invoice.count({
    where: { customerId, deletedAt: null },
  });
  if (invoiceCount > 0) {
    throw new ApiError(
      httpStatus.CONFLICT,
      `This customer has ${invoiceCount} invoice(s) and cannot be deleted`
    );
  }

  return prisma.customer.delete({ where: { id: customerId } });
};

export const CustomerService = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
