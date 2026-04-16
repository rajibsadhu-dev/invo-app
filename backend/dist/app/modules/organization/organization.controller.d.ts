import { Request, Response } from "express";
export declare const OrgController: {
    createOrganization: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getMyOrganizations: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getOrganizationById: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    updateOrganization: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    deleteOrganization: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    uploadLogo: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    getAllOrganizations: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
    assignOrganization: (req: Request, res: Response, next: import("express").NextFunction) => Promise<void>;
};
//# sourceMappingURL=organization.controller.d.ts.map