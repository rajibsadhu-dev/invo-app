import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { InvoiceService } from "./invoice.service";

const createInvoice = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const result = await InvoiceService.createInvoice(organizationId, req.body, req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Invoice created successfully",
    data: result,
  });
});

const getInvoices = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const { filter, search, sort, page, limit } = req.query;

  const result = await InvoiceService.getInvoices(organizationId, {
    filters: filter as string | string[] | undefined,
    search: search as string | undefined,
    sort: sort as string | undefined,
    page: page as string | undefined,
    limit: limit as string | undefined,
    orgRole: req.orgMember?.role,
    userId: req.user!.id,
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
  const result = await InvoiceService.getInvoiceById(
    organizationId, invoiceId, req.orgMember?.role, req.user!.id
  );

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
  const result = await InvoiceService.updateInvoice(
    organizationId, invoiceId, req.body, req.orgMember?.role, req.user!.id
  );

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
  await InvoiceService.deleteInvoice(
    organizationId, invoiceId, req.orgMember?.role, req.user!.id
  );

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
