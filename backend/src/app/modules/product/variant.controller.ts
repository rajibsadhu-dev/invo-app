import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { VariantService } from "./variant.service";

const getVariants = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const productId = Number(req.params.productId);
  const result = await VariantService.getVariants(organizationId, productId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Variants retrieved successfully",
    data: result,
  });
});

const getVariantById = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const productId = Number(req.params.productId);
  const variantId = Number(req.params.variantId);
  const result = await VariantService.getVariantById(
    organizationId,
    productId,
    variantId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Variant retrieved successfully",
    data: result,
  });
});

const createVariant = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const productId = Number(req.params.productId);
  const result = await VariantService.createVariant(
    organizationId,
    productId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Variant created successfully",
    data: result,
  });
});

const updateVariant = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const productId = Number(req.params.productId);
  const variantId = Number(req.params.variantId);
  const result = await VariantService.updateVariant(
    organizationId,
    productId,
    variantId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Variant updated successfully",
    data: result,
  });
});

const deleteVariant = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const productId = Number(req.params.productId);
  const variantId = Number(req.params.variantId);
  const { deactivated } = await VariantService.deleteVariant(
    organizationId,
    productId,
    variantId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: deactivated
      ? "Variant is used on invoices and has been deactivated instead of deleted"
      : "Variant deleted successfully",
    data: null,
  });
});

const bulkGenerate = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const productId = Number(req.params.productId);
  const result = await VariantService.bulkGenerate(
    organizationId,
    productId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message:
      result.created > 0
        ? `${result.created} variant${result.created === 1 ? "" : "s"} created` +
          (result.skipped > 0
            ? `, ${result.skipped} already existed`
            : "")
        : "All combinations already exist",
    data: result,
  });
});

export const VariantController = {
  getVariants,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant,
  bulkGenerate,
};
