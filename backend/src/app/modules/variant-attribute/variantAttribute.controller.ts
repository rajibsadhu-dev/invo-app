import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { VariantAttributeService } from "./variantAttribute.service";

const createAttribute = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const result = await VariantAttributeService.createAttribute(
    organizationId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Variant attribute created successfully",
    data: result,
  });
});

const getAttributes = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const result = await VariantAttributeService.getAttributes(organizationId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Variant attributes retrieved successfully",
    data: result,
  });
});

const getAttributeById = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const attributeId = Number(req.params.attributeId);
  const result = await VariantAttributeService.getAttributeById(
    organizationId,
    attributeId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Variant attribute retrieved successfully",
    data: result,
  });
});

const updateAttribute = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const attributeId = Number(req.params.attributeId);
  const result = await VariantAttributeService.updateAttribute(
    organizationId,
    attributeId,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Variant attribute updated successfully",
    data: result,
  });
});

const deleteAttribute = catchAsync(async (req: Request, res: Response) => {
  const organizationId = Number(req.params.id);
  const attributeId = Number(req.params.attributeId);
  await VariantAttributeService.deleteAttribute(organizationId, attributeId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Variant attribute deleted successfully",
    data: null,
  });
});

export const VariantAttributeController = {
  createAttribute,
  getAttributes,
  getAttributeById,
  updateAttribute,
  deleteAttribute,
};
