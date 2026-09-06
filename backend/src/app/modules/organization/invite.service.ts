import httpStatus from "http-status";
import bcrypt from "bcrypt";
import { OrgRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";
import { jwtHelpers } from "@/helpers/jwtHelper";
import { sendMail } from "@/helpers/mailer";
import config from "@/config";

const createInvite = async (
  orgId: number,
  email: string,
  role: OrgRole,
  invitedById: number
) => {
  const existingMember = await prisma.orgMember.findFirst({
    where: {
      organizationId: orgId,
      user: { email },
    },
  });
  if (existingMember) {
    throw new ApiError(httpStatus.CONFLICT, "User is already a member");
  }

  // Delete any existing invite for same org + email (replace it)
  await prisma.orgInvite.deleteMany({
    where: { organizationId: orgId, email },
  });

  const token = jwtHelpers.createToken(
    { orgId, email, role, purpose: "org-invite" },
    config.jwt.secret,
    "7d" as string
  );

  const invite = await prisma.orgInvite.create({
    data: {
      organizationId: orgId,
      email,
      role,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      invitedById,
    },
    include: {
      organization: { select: { name: true } },
      invitedBy: { select: { name: true } },
    },
  });

  const acceptUrl = `${config.cors_origins[0] || `http://localhost:${config.port}`}/accept-invite?token=${token}`;

  sendMail({
    to: email,
    subject: `You're invited to ${invite.organization.name} — Invo`,
    html: `
      <h2>Team Invitation</h2>
      <p>${invite.invitedBy.name} has invited you to join <strong>${invite.organization.name}</strong> as a <strong>${role}</strong>.</p>
      <p><a href="${acceptUrl}" style="display:inline-block;padding:10px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">Accept Invitation</a></p>
      <p>Or copy this link: <br/>${acceptUrl}</p>
      <p>This invitation expires in 7 days.</p>
    `,
  }).catch(() => {});

  return invite;
};

const getInvites = async (orgId: number) => {
  return prisma.orgInvite.findMany({
    where: { organizationId: orgId },
    include: {
      invitedBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

const revokeInvite = async (orgId: number, inviteId: number) => {
  const invite = await prisma.orgInvite.findUnique({
    where: { id: inviteId },
  });

  if (!invite || invite.organizationId !== orgId) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invite not found");
  }

  await prisma.orgInvite.delete({ where: { id: inviteId } });
};

const acceptInvite = async (token: string, userId: number) => {
  let decoded;
  try {
    decoded = jwtHelpers.verifyToken(token, config.jwt.secret);
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired invitation");
  }

  if (decoded.purpose !== "org-invite") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid invitation link");
  }

  const invite = await prisma.orgInvite.findUnique({ where: { token } });
  if (!invite) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invitation not found or already used");
  }

  if (invite.expiresAt < new Date()) {
    await prisma.orgInvite.delete({ where: { id: invite.id } });
    throw new ApiError(httpStatus.BAD_REQUEST, "Invitation has expired");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.email !== invite.email) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "This invitation was sent to a different email address"
    );
  }

  const existing = await prisma.orgMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: invite.organizationId,
        userId,
      },
    },
  });

  if (existing) {
    await prisma.orgInvite.delete({ where: { id: invite.id } });
    throw new ApiError(httpStatus.CONFLICT, "You are already a member of this organization");
  }

  await prisma.$transaction([
    prisma.orgMember.create({
      data: {
        organizationId: invite.organizationId,
        userId,
        role: invite.role,
      },
    }),
    prisma.orgInvite.delete({ where: { id: invite.id } }),
  ]);

  const org = await prisma.organization.findUnique({
    where: { id: invite.organizationId },
    select: { id: true, name: true },
  });

  return org;
};

const getInviteInfo = async (token: string) => {
  let decoded;
  try {
    decoded = jwtHelpers.verifyToken(token, config.jwt.secret);
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired invitation");
  }

  if (decoded.purpose !== "org-invite") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid invitation link");
  }

  const invite = await prisma.orgInvite.findUnique({
    where: { token },
    include: {
      organization: { select: { name: true } },
      invitedBy: { select: { name: true } },
    },
  });

  if (!invite) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invitation not found or already used");
  }

  if (invite.expiresAt < new Date()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invitation has expired");
  }

  return {
    email: invite.email,
    role: invite.role,
    orgName: invite.organization.name,
    invitedBy: invite.invitedBy.name,
  };
};

export const InviteService = {
  createInvite,
  getInvites,
  revokeInvite,
  acceptInvite,
  getInviteInfo,
};
