import { Router, Request, Response, NextFunction } from "express";
import auth from "@/app/middlewares/auth";
import validateRequest from "@/app/middlewares/validateRequest";
import ownershipGuard from "@/app/middlewares/ownershipGuard";
import { uploadLogo } from "@/helpers/multer";
import { OrgValidation } from "./organization.validation";
import { OrgController } from "./organization.controller";
import { CustomerRoutes } from "@/app/modules/customer/customer.route";
import { InvoiceRoutes } from "@/app/modules/invoice/invoice.route";

const router = Router();

// All org routes require authentication
router.use(auth());

// Create org
router.post(
  "/",
  validateRequest(OrgValidation.createOrgSchema),
  OrgController.createOrganization
);

// Get all orgs belonging to the current user
router.get("/", OrgController.getMyOrganizations);

// Routes below require ownership
router.get("/:id", ownershipGuard, OrgController.getOrganizationById);

router.patch(
  "/:id",
  ownershipGuard,
  validateRequest(OrgValidation.updateOrgSchema),
  OrgController.updateOrganization
);

router.delete("/:id", ownershipGuard, OrgController.deleteOrganization);

// Customer routes — ownership verified once, then delegated
router.use("/:id/customers", ownershipGuard, CustomerRoutes);

// Invoice routes — ownership verified once, then delegated
router.use("/:id/invoices", ownershipGuard, InvoiceRoutes);

// Logo upload — ownershipGuard runs FIRST so an unauthorized request is rejected before
// multer writes anything to disk. It only needs req.params.id, never the body.
router.post(
  "/:id/logo",
  ownershipGuard,
  (req: Request, res: Response, next: NextFunction) => {
    uploadLogo(req, res, (err) => (err ? next(err) : next()));
  },
  OrgController.uploadLogo
);

export const OrgRoutes = router;
