import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { OrgRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";

export type OrgPermission =
  | "org:manage"
  | "org:invite"
  | "team:manage"
  | "invoice:create"
  | "invoice:edit"
  | "invoice:delete"
  | "invoice:view"
  | "customer:create"
  | "customer:edit"
  | "customer:delete"
  | "customer:view";

const ROLE_PERMISSIONS: Record<OrgRole, Set<OrgPermission>> = {
  owner: new Set([
    "org:manage",
    "org:invite",
    "team:manage",
    "invoice:create",
    "invoice:edit",
    "invoice:delete",
    "invoice:view",
    "customer:create",
    "customer:edit",
    "customer:delete",
    "customer:view",
  ]),
  admin: new Set([
    "org:manage",
    "org:invite",
    "team:manage",
    "invoice:create",
    "invoice:edit",
    "invoice:delete",
    "invoice:view",
    "customer:create",
    "customer:edit",
    "customer:delete",
    "customer:view",
  ]),
  manager: new Set([
    "org:invite",
    "invoice:create",
    "invoice:edit",
    "invoice:delete",
    "invoice:view",
    "customer:create",
    "customer:edit",
    "customer:delete",
    "customer:view",
  ]),
  staff: new Set([
    "invoice:create",
    "invoice:edit",
    "invoice:view",
    "customer:create",
    "customer:edit",
    "customer:view",
  ]),
  viewer: new Set([
    "invoice:view",
    "customer:view",
  ]),
};

export function hasPermission(role: OrgRole, permission: OrgPermission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/**
 * Checks that the authenticated user is a member of the organization and holds
 * at least one of the required permissions.
 *
 * Superadmins bypass the membership check entirely.
 * Attaches `req.org` and `req.orgMember` for downstream handlers.
 */
const orgRole = (...requiredPermissions: OrgPermission[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const orgId = Number(req.params.id || req.params.orgId);
      const user = req.user;

      if (!user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
      }

      if (!Number.isInteger(orgId) || orgId <= 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid organization ID");
      }

      const org = await prisma.organization.findUnique({ where: { id: orgId } });

      if (!org) {
        throw new ApiError(httpStatus.NOT_FOUND, "Organization not found");
      }

      req.org = org;

      if (user.role === "superadmin") {
        return next();
      }

      const membership = await prisma.orgMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: orgId,
            userId: user.id,
          },
        },
      });

      if (!membership) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "You do not have permission to access this organization"
        );
      }

      const hasAny = requiredPermissions.some((p) =>
        hasPermission(membership.role, p)
      );

      if (!hasAny) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "You do not have permission to perform this action"
        );
      }

      req.orgMember = membership;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export default orgRole;
