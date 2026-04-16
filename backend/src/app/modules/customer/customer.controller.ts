import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { CustomerService } from "./customer.service";

const createCustomer = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const result = await CustomerService.createCustomer(organizationId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Customer created successfully",
    data: result,
  });
});

const getCustomers = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const { search, page, limit, sortBy, sortOrder } = req.query as Record<string, string>;

  const result = await CustomerService.getCustomers(organizationId, {
    search,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy,
    sortOrder: sortOrder === "asc" ? "asc" : sortOrder === "desc" ? "desc" : undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Customers retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getCustomerById = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const customerId = Number(req.params.customerId);
  const result = await CustomerService.getCustomerById(organizationId, customerId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Customer retrieved successfully",
    data: result,
  });
});

const updateCustomer = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const customerId = Number(req.params.customerId);
  const result = await CustomerService.updateCustomer(organizationId, customerId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Customer updated successfully",
    data: result,
  });
});

const deleteCustomer = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const customerId = Number(req.params.customerId);
  await CustomerService.deleteCustomer(organizationId, customerId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Customer deleted successfully",
    data: null,
  });
});

export const CustomerController = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
