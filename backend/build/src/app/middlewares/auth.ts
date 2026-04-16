import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { jwtHelpers } from "@/helpers/jwtHelper";
import config from "@/config";
import ApiError from "@/app/errors/ApiError";
import { UserRole } from "@/app/modules/user/user.interface";

const auth =
  (...requiredRoles: UserRole[]) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "You are not authorized"
        );
      }

      const token = authHeader.split(" ")[1];

      // Verify token
      const decoded = jwtHelpers.verifyToken(token, config.jwt.secret);

      // Attach user to request
      (req as any).user = decoded;

      // Check role authorization
      if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "You do not have permission to access this resource"
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

export default auth;
