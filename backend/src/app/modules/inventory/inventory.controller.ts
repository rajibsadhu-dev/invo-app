import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { InventoryService } from "./inventory.service";

const adjustStock = catchAsync(async (req, res) => {
  const organizationId = Number(req.params.id);
  const productId = Number(req.params.productId);
  const userId = req.user!.id;

  const movement = await InventoryService.adjustStock(
    organizationId,
    productId,
    userId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Stock adjusted",
    data: movement,
  });
});

const setStock = catchAsync(async (req, res) => {
  const organizationId = Number(req.params.id);
  const productId = Number(req.params.productId);
  const userId = req.user!.id;

  const movement = await InventoryService.setStock(
    organizationId,
    productId,
    userId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Stock set",
    data: movement,
  });
});

const getMovements = catchAsync(async (req, res) => {
  const organizationId = Number(req.params.id);
  const result = await InventoryService.getMovements(
    organizationId,
    req.query as never
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Stock movements retrieved",
    data: result.data,
    meta: result.meta,
  });
});

const getProductMovements = catchAsync(async (req, res) => {
  const organizationId = Number(req.params.id);
  const productId = Number(req.params.productId);
  const result = await InventoryService.getProductMovements(
    organizationId,
    productId,
    req.query as never
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product stock movements retrieved",
    data: result.data,
    meta: result.meta,
  });
});

const getLowStock = catchAsync(async (req, res) => {
  const organizationId = Number(req.params.id);
  const result = await InventoryService.getLowStock(organizationId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Low-stock items retrieved",
    data: result,
  });
});

const getSummary = catchAsync(async (req, res) => {
  const organizationId = Number(req.params.id);
  const result = await InventoryService.getSummary(organizationId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Inventory summary retrieved",
    data: result,
  });
});

const getValuation = catchAsync(async (req, res) => {
  const organizationId = Number(req.params.id);
  const result = await InventoryService.getValuation(organizationId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Inventory valuation retrieved",
    data: result,
  });
});

export const InventoryController = {
  adjustStock,
  setStock,
  getMovements,
  getProductMovements,
  getLowStock,
  getSummary,
  getValuation,
};
