import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { EstimateService } from "./estimate.service";

const createEstimate = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const result = await EstimateService.createEstimate(organizationId, req.body, req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Estimate created successfully",
    data: result,
  });
});

const getEstimates = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const { filter, search, sort, page, limit } = req.query;

  const result = await EstimateService.getEstimates(organizationId, {
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
    message: "Estimates retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getEstimateById = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const estimateId = Number(req.params.estimateId);
  const result = await EstimateService.getEstimateById(
    organizationId, estimateId, req.orgMember?.role, req.user!.id
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Estimate retrieved successfully",
    data: result,
  });
});

const updateEstimate = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const estimateId = Number(req.params.estimateId);
  const result = await EstimateService.updateEstimate(
    organizationId, estimateId, req.body, req.orgMember?.role, req.user!.id
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Estimate updated successfully",
    data: result,
  });
});

const deleteEstimate = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const estimateId = Number(req.params.estimateId);
  await EstimateService.deleteEstimate(
    organizationId, estimateId, req.orgMember?.role, req.user!.id
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Estimate deleted successfully",
    data: null,
  });
});

const sendEstimate = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const estimateId = Number(req.params.estimateId);
  const result = await EstimateService.sendEstimate(
    organizationId,
    estimateId,
    req.body,
    req.user!.id,
    req.orgMember?.role
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Estimate sent successfully",
    data: result,
  });
});

const convertToInvoice = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const estimateId = Number(req.params.estimateId);
  const result = await EstimateService.convertToInvoice(
    organizationId,
    estimateId,
    req.orgMember?.role,
    req.user!.id
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Estimate converted to invoice successfully",
    data: result,
  });
});

const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const estimateId = Number(req.params.estimateId);
  const result = await EstimateService.updateStatus(
    organizationId,
    estimateId,
    req.body.status,
    req.orgMember?.role,
    req.user!.id
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Estimate status updated successfully",
    data: result,
  });
});

export const EstimateController = {
  createEstimate,
  getEstimates,
  getEstimateById,
  updateEstimate,
  deleteEstimate,
  sendEstimate,
  convertToInvoice,
  updateStatus,
};
