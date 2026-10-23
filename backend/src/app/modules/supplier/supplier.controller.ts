import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { SupplierService } from "./supplier.service";

const createSupplier = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const result = await SupplierService.createSupplier(organizationId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Supplier created successfully",
    data: result,
  });
});

const getSuppliers = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const { filter, search, sort, page, limit } = req.query;

  const result = await SupplierService.getSuppliers(organizationId, {
    filters: filter as string | string[] | undefined,
    search: search as string | undefined,
    sort: sort as string | undefined,
    page: page as string | undefined,
    limit: limit as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Suppliers retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getSupplierById = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const supplierId = Number(req.params.supplierId);
  const result = await SupplierService.getSupplierById(organizationId, supplierId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Supplier retrieved successfully",
    data: result,
  });
});

const updateSupplier = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const supplierId = Number(req.params.supplierId);
  const result = await SupplierService.updateSupplier(organizationId, supplierId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Supplier updated successfully",
    data: result,
  });
});

const deleteSupplier = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const supplierId = Number(req.params.supplierId);
  await SupplierService.deleteSupplier(organizationId, supplierId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Supplier deleted successfully",
    data: null,
  });
});

const searchSuppliers = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const q = (req.query.q as string) || "";
  const result = await SupplierService.searchSuppliers(organizationId, q);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Search results",
    data: result,
  });
});

export const SupplierController = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  searchSuppliers,
};
