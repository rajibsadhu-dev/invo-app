import { Router, Request, Response, NextFunction } from "express";
import auth from "@/app/middlewares/auth";
import validateRequest from "@/app/middlewares/validateRequest";
import ownershipGuard from "@/app/middlewares/ownershipGuard";
import orgRole from "@/app/middlewares/orgRole";
import { uploadLogo } from "@/helpers/multer";
import { OrgValidation } from "./organization.validation";
import { OrgController } from "./organization.controller";
import { TeamController } from "./team.controller";
import { TeamValidation } from "./team.validation";
import { InviteController } from "./invite.controller";
import { InviteValidation } from "./invite.validation";
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

// View org — any member
router.get("/:id", ownershipGuard, OrgController.getOrganizationById);

// Edit org — owner or admin
router.patch(
  "/:id",
  orgRole("org:manage"),
  validateRequest(OrgValidation.updateOrgSchema),
  OrgController.updateOrganization
);

// Delete org — owner only (org:manage is owner+admin, so we still need a direct check)
router.delete("/:id", orgRole("org:manage"), OrgController.deleteOrganization);

// Team management — any member can view, owner/admin can manage
router.get("/:id/team", ownershipGuard, TeamController.getMembers);
router.patch(
  "/:id/team/:memberId",
  orgRole("team:manage"),
  validateRequest(TeamValidation.updateRoleSchema),
  TeamController.updateMemberRole
);
router.delete(
  "/:id/team/:memberId",
  orgRole("team:manage"),
  TeamController.removeMember
);

// Invitations — owner/admin/manager can invite
router.post(
  "/:id/invites",
  orgRole("org:invite"),
  validateRequest(InviteValidation.createInviteSchema),
  InviteController.createInvite
);
router.get("/:id/invites", orgRole("org:invite"), InviteController.getInvites);
router.delete(
  "/:id/invites/:inviteId",
  orgRole("org:invite"),
  InviteController.revokeInvite
);

// Customer routes — permission-guarded per-action inside the sub-router
router.use("/:id/customers", CustomerRoutes);

// Invoice routes — permission-guarded per-action inside the sub-router
router.use("/:id/invoices", InvoiceRoutes);

// Logo upload — owner or admin
router.post(
  "/:id/logo",
  orgRole("org:manage"),
  (req: Request, res: Response, next: NextFunction) => {
    uploadLogo(req, res, (err) => (err ? next(err) : next()));
  },
  OrgController.uploadLogo
);

export const OrgRoutes = router;
