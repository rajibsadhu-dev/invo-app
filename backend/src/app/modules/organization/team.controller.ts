import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { TeamService } from "./team.service";

const getMembers = catchAsync(async (req: Request, res: Response) => {
  const orgId = Number(req.params.id);
  const members = await TeamService.getMembers(orgId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Team members retrieved",
    data: members,
  });
});

const updateMemberRole = catchAsync(async (req: Request, res: Response) => {
  const orgId = Number(req.params.id);
  const memberId = Number(req.params.memberId);
  const member = await TeamService.updateMemberRole(
    orgId,
    memberId,
    req.body.role,
    req.user!.id
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Member role updated",
    data: member,
  });
});

const removeMember = catchAsync(async (req: Request, res: Response) => {
  const orgId = Number(req.params.id);
  const memberId = Number(req.params.memberId);
  await TeamService.removeMember(orgId, memberId, req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Member removed",
    data: null,
  });
});

export const TeamController = {
  getMembers,
  updateMemberRole,
  removeMember,
};
