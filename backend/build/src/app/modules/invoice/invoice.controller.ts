import { Request, Response } from "express";
import httpStatus from "http-status";
import { InvoiceStatus } from "@prisma/client";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { InvoiceService } from "./invoice.service";

const createInvoice = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const result = await InvoiceService.createInvoice(organizationId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Invoice created successfully",
    data: result,
  });
});

const getInvoices = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const { status, customerId, search, page, limit, sortBy, sortOrder } =
    req.query as Record<string, string>;

  const result = await InvoiceService.getInvoices(organizationId, {
    status: status as InvoiceStatus | undefined,
    customerId: customerId ? Number(customerId) : undefined,
    search,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    sortBy,
    sortOrder: sortOrder === "asc" ? "asc" : sortOrder === "desc" ? "desc" : undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoices retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getInvoiceById = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const invoiceId = Number(req.params.invoiceId);
  const result = await InvoiceService.getInvoiceById(organizationId, invoiceId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice retrieved successfully",
    data: result,
  });
});

const updateInvoice = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const invoiceId = Number(req.params.invoiceId);
  const result = await InvoiceService.updateInvoice(organizationId, invoiceId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice updated successfully",
    data: result,
  });
});

const deleteInvoice = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const invoiceId = Number(req.params.invoiceId);
  await InvoiceService.deleteInvoice(organizationId, invoiceId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice deleted successfully",
    data: null,
  });
});

export const InvoiceController = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
};
