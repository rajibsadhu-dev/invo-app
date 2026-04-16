import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";

/**
 * Verifies the authenticated user owns the organization at req.params.id.
 * Superadmin bypasses this check and can access any organization.
 * Attaches the org to req for downstream use: (req as any).org
 */
const ownershipGuard = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orgId = Number(req.params.id);
    const userId = (req as any).user?.id as number;

    if (!orgId || isNaN(orgId)) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid organization ID");
    }

    const org = await prisma.organization.findUnique({ where: { id: orgId } });

    if (!org) {
      throw new ApiError(httpStatus.NOT_FOUND, "Organization not found");
    }

    // Superadmin bypasses ownership check
    const role = (req as any).user?.role as string;
    if (role !== "superadmin" && org.ownerId !== userId) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "You do not have permission to access this organization"
      );
    }

    (req as any).org = org;
    next();
  } catch (error) {
    next(error);
  }
};

export default ownershipGuard;
