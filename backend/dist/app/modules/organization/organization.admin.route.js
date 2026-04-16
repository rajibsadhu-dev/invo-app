"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminOrgRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("@/app/middlewares/auth"));
const validateRequest_1 = __importDefault(require("@/app/middlewares/validateRequest"));
const organization_validation_1 = require("./organization.validation");
const organization_controller_1 = require("./organization.controller");
const adminOrgRouter = (0, express_1.Router)();
// All admin org routes require superadmin role
adminOrgRouter.use((0, auth_1.default)("superadmin"));
// GET  /api/v1/admin/organizations         — list all orgs (with owner info, optional ?search=)
adminOrgRouter.get("/", organization_controller_1.OrgController.getAllOrganizations);
// POST /api/v1/admin/organizations         — create org (superadmin becomes owner)
adminOrgRouter.post("/", (0, validateRequest_1.default)(organization_validation_1.OrgValidation.createOrgSchema), organization_controller_1.OrgController.createOrganization);
// PATCH /api/v1/admin/organizations/:id/assign — transfer org to another user
adminOrgRouter.patch("/:id/assign", (0, validateRequest_1.default)(organization_validation_1.OrgValidation.assignOrgSchema), organization_controller_1.OrgController.assignOrganization);
exports.AdminOrgRoutes = adminOrgRouter;
//# sourceMappingURL=organization.admin.route.js.map