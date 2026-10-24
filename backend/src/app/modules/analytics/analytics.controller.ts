import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { AnalyticsService } from "./analytics.service";

const getSummary = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const result = await AnalyticsService.getSummary(organizationId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Analytics summary retrieved successfully",
    data: result,
  });
});

const getRevenueOverTime = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const months = Math.min(Math.max(Number(req.query.months) || 12, 1), 36);
  const result = await AnalyticsService.getRevenueOverTime(organizationId, months);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Revenue over time retrieved successfully",
    data: result,
  });
});

const getGstSummary = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;
  const result = await AnalyticsService.getGstSummary(organizationId, from, to);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "GST summary retrieved successfully",
    data: result,
  });
});

const getTopCustomers = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const result = await AnalyticsService.getTopCustomers(organizationId, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Top customers retrieved successfully",
    data: result,
  });
});

const getStatusBreakdown = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const result = await AnalyticsService.getStatusBreakdown(organizationId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invoice status breakdown retrieved successfully",
    data: result,
  });
});

export const AnalyticsController = {
  getSummary,
  getRevenueOverTime,
  getGstSummary,
  getTopCustomers,
  getStatusBreakdown,
};
