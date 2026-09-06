import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";

const emailVerified = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { emailVerifiedAt: true },
    });

    if (!dbUser?.emailVerifiedAt) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Please verify your email address before creating invoices"
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default emailVerified;
