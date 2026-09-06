import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";

/**
 * Verifies the authenticated user owns the organization at req.params.id.
 * Superadmin bypasses this check and can access any organization.
 * Attaches the org to `req.org` for downstream use.
 *
 * Must run BEFORE any body/file parsing for the route it protects — otherwise an
 * unauthorized request has already written its payload to disk by the time it is refused.
 */
const ownershipGuard = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = Number(req.params.id);
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

    if (user.role !== "superadmin" && org.ownerId !== user.id) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You do not have permission to access this organization"
      );
    }

    req.org = org;
    next();
  } catch (error) {
    next(error);
  }
};

export default ownershipGuard;
