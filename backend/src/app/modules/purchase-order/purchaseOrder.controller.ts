import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { PurchaseOrderService } from "./purchaseOrder.service";

const createPurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const result = await PurchaseOrderService.createPurchaseOrder(organizationId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Purchase order created successfully",
    data: result,
  });
});

const getPurchaseOrders = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const { filter, search, sort, page, limit } = req.query;

  const result = await PurchaseOrderService.getPurchaseOrders(organizationId, {
    filters: filter as string | string[] | undefined,
    search: search as string | undefined,
    sort: sort as string | undefined,
    page: page as string | undefined,
    limit: limit as string | undefined,
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Purchase orders retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getPurchaseOrderById = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const poId = Number(req.params.poId);
  const result = await PurchaseOrderService.getPurchaseOrderById(organizationId, poId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Purchase order retrieved successfully",
    data: result,
  });
});

const updatePurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const poId = Number(req.params.poId);
  const result = await PurchaseOrderService.updatePurchaseOrder(organizationId, poId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Purchase order updated successfully",
    data: result,
  });
});

const deletePurchaseOrder = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const poId = Number(req.params.poId);
  await PurchaseOrderService.deletePurchaseOrder(organizationId, poId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Purchase order deleted successfully",
    data: null,
  });
});

const receiveGoods = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const poId = Number(req.params.poId);
  const userId = req.user!.id;
  const result = await PurchaseOrderService.receiveGoods(
    organizationId,
    poId,
    userId,
    req.body.items
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Goods received successfully",
    data: result,
  });
});

export const PurchaseOrderController = {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrder,
  deletePurchaseOrder,
  receiveGoods,
};
