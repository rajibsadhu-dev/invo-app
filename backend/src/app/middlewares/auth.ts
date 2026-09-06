import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { JsonWebTokenError, JwtPayload, TokenExpiredError } from "jsonwebtoken";
import { jwtHelpers } from "@/helpers/jwtHelper";
import config from "@/config";
import ApiError from "@/app/errors/ApiError";
import { UserRole } from "@/app/modules/user/user.interface";
import type { AuthUser } from "@/types/express";

const ROLES: readonly UserRole[] = ["superadmin", "user"];

/**
 * Validate the decoded payload rather than trusting its shape. A token signed with a
 * valid secret but an unexpected body must not become a half-populated `req.user`.
 */
const toAuthUser = (payload: JwtPayload): AuthUser => {
  const { id, email, role } = payload;

  if (
    typeof id !== "number" ||
    typeof email !== "string" ||
    typeof role !== "string" ||
    !ROLES.includes(role as UserRole)
  ) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Malformed token payload");
  }

  return { id, email, role: role as UserRole };
};

const auth =
  (...requiredRoles: UserRole[]) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
      }

      const token = authHeader.slice("Bearer ".length).trim();

      let decoded: JwtPayload;
      try {
        decoded = jwtHelpers.verifyToken(token, config.jwt.secret);
      } catch (error) {
        // Without this translation an expired token surfaces as a 500 and the client's
        // silent-refresh flow — which only reacts to 401 — never fires.
        if (error instanceof TokenExpiredError) {
          throw new ApiError(httpStatus.UNAUTHORIZED, "Access token expired");
        }
        if (error instanceof JsonWebTokenError) {
          throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid access token");
        }
        throw error;
      }

      req.user = toAuthUser(decoded);

      if (requiredRoles.length && !requiredRoles.includes(req.user.role)) {
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
