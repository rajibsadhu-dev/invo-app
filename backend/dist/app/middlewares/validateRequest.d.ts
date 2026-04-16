import { NextFunction, Request, Response } from "express";
import { z } from "zod";
declare const validateRequest: (schema: z.ZodType) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
export default validateRequest;
//# sourceMappingURL=validateRequest.d.ts.map