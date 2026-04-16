import { NextFunction, Request, Response } from "express";
/**
 * Verifies the authenticated user owns the organization at req.params.id.
 * Superadmin bypasses this check and can access any organization.
 * Attaches the org to req for downstream use: (req as any).org
 */
declare const ownershipGuard: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export default ownershipGuard;
//# sourceMappingURL=ownershipGuard.d.ts.map