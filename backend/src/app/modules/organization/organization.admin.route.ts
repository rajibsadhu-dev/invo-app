import { Router } from "express";
import auth from "@/app/middlewares/auth";
import validateRequest from "@/app/middlewares/validateRequest";
import { OrgValidation } from "./organization.validation";
import { OrgController } from "./organization.controller";

const adminOrgRouter = Router();

// All admin org routes require superadmin role
adminOrgRouter.use(auth("superadmin"));

// GET  /api/v1/admin/organizations         — list all orgs (with owner info, optional ?search=)
adminOrgRouter.get("/", OrgController.getAllOrganizations);

// POST /api/v1/admin/organizations         — create org (superadmin becomes owner)
adminOrgRouter.post(
  "/",
  validateRequest(OrgValidation.createOrgSchema),
  OrgController.createOrganization
);

// PATCH /api/v1/admin/organizations/:id/assign — transfer org to another user
adminOrgRouter.patch(
  "/:id/assign",
  validateRequest(OrgValidation.assignOrgSchema),
  OrgController.assignOrganization
);

export const AdminOrgRoutes = adminOrgRouter;
