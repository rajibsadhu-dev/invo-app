import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { OrgService } from "./organization.service";

const createOrganization = catchAsync(async (req: Request, res: Response) => {
  const ownerId = (req as any).user.id as number;
  const result = await OrgService.createOrganization(ownerId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Organization created successfully",
    data: result,
  });
});

const getMyOrganizations = catchAsync(async (req: Request, res: Response) => {
  const ownerId = (req as any).user.id as number;
  const result = await OrgService.getMyOrganizations(ownerId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organizations retrieved successfully",
    data: result,
  });
});

const getOrganizationById = catchAsync(async (req: Request, res: Response) => {
  // org already fetched & verified by ownershipGuard
  const result = (req as any).org;

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization retrieved successfully",
    data: result,
  });
});

const updateOrganization = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await OrgService.updateOrganization(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization updated successfully",
    data: result,
  });
});

const deleteOrganization = catchAsync(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await OrgService.deleteOrganization(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization deleted successfully",
    data: null,
  });
});

const uploadLogo = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    return sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "No file uploaded",
      data: null,
    });
  }

  const id = Number(req.params.id);
  const result = await OrgService.updateLogo(id, req.file.filename);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logo uploaded successfully",
    data: result,
  });
});

const getAllOrganizations = catchAsync(async (req: Request, res: Response) => {
  const search = req.query.search as string | undefined;
  const result = await OrgService.getAllOrganizations(search);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All organizations retrieved successfully",
    data: result,
  });
});

const assignOrganization = catchAsync(async (req: Request, res: Response) => {
  const orgId = Number(req.params.id);
  const { userId } = req.body;
  const result = await OrgService.assignOrganization(orgId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Organization assigned successfully",
    data: result,
  });
});

export const OrgController = {
  createOrganization,
  getMyOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  uploadLogo,
  getAllOrganizations,
  assignOrganization,
};
