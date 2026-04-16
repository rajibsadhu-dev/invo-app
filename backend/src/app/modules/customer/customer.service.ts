import httpStatus from "http-status";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";
import { ICreateCustomer, IUpdateCustomer, ICustomerQuery } from "./customer.interface";

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
  const {
    search,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const where: Prisma.CustomerWhereInput = {
    organizationId,
    ...(search && {
      OR: [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ],
    }),
  };

  const allowedSortFields = ["name", "email", "createdAt", "updatedAt"];
  const orderByField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { [orderByField]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
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
  return prisma.customer.delete({ where: { id: customerId } });
};

export const CustomerService = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
