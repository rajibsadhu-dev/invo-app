import httpStatus from "http-status";
import { OrgRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";

const getMembers = async (orgId: number) => {
  return prisma.orgMember.findMany({
    where: { organizationId: orgId },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });
};

const updateMemberRole = async (
  orgId: number,
  memberId: number,
  role: OrgRole,
  actorId: number
) => {
  const member = await prisma.orgMember.findUnique({
    where: { id: memberId },
  });

  if (!member || member.organizationId !== orgId) {
    throw new ApiError(httpStatus.NOT_FOUND, "Member not found");
  }

  if (member.userId === actorId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot change your own role");
  }

  if (member.role === "owner") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Cannot change the owner's role. Transfer ownership first."
    );
  }

  return prisma.orgMember.update({
    where: { id: memberId },
    data: { role },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
  });
};

const removeMember = async (orgId: number, memberId: number, actorId: number) => {
  const member = await prisma.orgMember.findUnique({
    where: { id: memberId },
  });

  if (!member || member.organizationId !== orgId) {
    throw new ApiError(httpStatus.NOT_FOUND, "Member not found");
  }

  if (member.userId === actorId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot remove yourself");
  }

  if (member.role === "owner") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Cannot remove the organization owner"
    );
  }

  await prisma.orgMember.delete({ where: { id: memberId } });
};

export const TeamService = {
  getMembers,
  updateMemberRole,
  removeMember,
};
