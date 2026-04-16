import { NextFunction, Request, Response } from "express";
import { UserRole } from "@/app/modules/user/user.interface";
declare const auth: (...requiredRoles: UserRole[]) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export default auth;
//# sourceMappingURL=auth.d.ts.map