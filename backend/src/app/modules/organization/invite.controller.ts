import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { InviteService } from "./invite.service";

const createInvite = catchAsync(async (req: Request, res: Response) => {
  const orgId = Number(req.params.id);
  const invite = await InviteService.createInvite(
    orgId,
    req.body.email,
    req.body.role,
    req.user!.id
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Invitation sent",
    data: invite,
  });
});

const getInvites = catchAsync(async (req: Request, res: Response) => {
  const orgId = Number(req.params.id);
  const invites = await InviteService.getInvites(orgId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invitations retrieved",
    data: invites,
  });
});

const revokeInvite = catchAsync(async (req: Request, res: Response) => {
  const orgId = Number(req.params.id);
  const inviteId = Number(req.params.inviteId);
  await InviteService.revokeInvite(orgId, inviteId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invitation revoked",
    data: null,
  });
});

const acceptInvite = catchAsync(async (req: Request, res: Response) => {
  const org = await InviteService.acceptInvite(req.body.token, req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invitation accepted",
    data: org,
  });
});

const getInviteInfo = catchAsync(async (req: Request, res: Response) => {
  const token = req.query.token as string;
  const info = await InviteService.getInviteInfo(token);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Invitation details",
    data: info,
  });
});

export const InviteController = {
  createInvite,
  getInvites,
  revokeInvite,
  acceptInvite,
  getInviteInfo,
};
