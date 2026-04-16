"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgRoutes = void 0;
const express_1 = require("express");
const auth_1 = __importDefault(require("@/app/middlewares/auth"));
const validateRequest_1 = __importDefault(require("@/app/middlewares/validateRequest"));
const ownershipGuard_1 = __importDefault(require("@/app/middlewares/ownershipGuard"));
const multer_1 = require("@/helpers/multer");
const organization_validation_1 = require("./organization.validation");
const organization_controller_1 = require("./organization.controller");
const customer_route_1 = require("@/app/modules/customer/customer.route");
const invoice_route_1 = require("@/app/modules/invoice/invoice.route");
const router = (0, express_1.Router)();
// All org routes require authentication
router.use((0, auth_1.default)());
// Create org
router.post("/", (0, validateRequest_1.default)(organization_validation_1.OrgValidation.createOrgSchema), organization_controller_1.OrgController.createOrganization);
// Get all orgs belonging to the current user
router.get("/", organization_controller_1.OrgController.getMyOrganizations);
// Routes below require ownership
router.get("/:id", ownershipGuard_1.default, organization_controller_1.OrgController.getOrganizationById);
router.patch("/:id", ownershipGuard_1.default, (0, validateRequest_1.default)(organization_validation_1.OrgValidation.updateOrgSchema), organization_controller_1.OrgController.updateOrganization);
router.delete("/:id", ownershipGuard_1.default, organization_controller_1.OrgController.deleteOrganization);
// Customer routes — ownership verified once, then delegated
router.use("/:id/customers", ownershipGuard_1.default, customer_route_1.CustomerRoutes);
// Invoice routes — ownership verified once, then delegated
router.use("/:id/invoices", ownershipGuard_1.default, invoice_route_1.InvoiceRoutes);
// Logo upload — multer runs before ownershipGuard so req.file is available
router.post("/:id/logo", (req, res, next) => {
    (0, multer_1.uploadLogo)(req, res, (err) => {
        if (err)
            return next(err);
        next();
    });
}, ownershipGuard_1.default, organization_controller_1.OrgController.uploadLogo);
exports.OrgRoutes = router;
//# sourceMappingURL=organization.route.js.map