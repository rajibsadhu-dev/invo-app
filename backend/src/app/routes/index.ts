import { Router } from "express";
import { AuthRoutes } from "@/app/modules/auth/auth.route";
import { UserRoutes } from "@/app/modules/user/user.route";
import { OrgRoutes } from "@/app/modules/organization/organization.route";
import { AdminOrgRoutes } from "@/app/modules/organization/organization.admin.route";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, message: "Hello World — Invo server is running 🚀" });
});

router.use("/auth", AuthRoutes);
router.use("/users", UserRoutes);
router.use("/organizations", OrgRoutes);
router.use("/admin/organizations", AdminOrgRoutes);

export default router;
