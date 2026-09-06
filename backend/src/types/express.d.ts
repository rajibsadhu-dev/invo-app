import { Organization } from "@prisma/client";
import { UserRole } from "@/app/modules/user/user.interface";

/**
 * The verified JWT payload attached by the `auth` middleware.
 * Shape is validated in the middleware, not merely asserted.
 */
export type AuthUser = {
  id: number;
  email: string;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      /** Set by `ownershipGuard` after verifying the caller may access this org. */
      org?: Organization;
    }
  }
}

export {};
