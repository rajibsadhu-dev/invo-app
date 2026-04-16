import { Request, Response } from "express";
export declare const AuthController: {
    login: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    refreshToken: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    logout: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getMe: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
};
//# sourceMappingURL=auth.controller.d.ts.map