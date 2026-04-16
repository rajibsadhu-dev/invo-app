"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_route_1 = require("@/app/modules/auth/auth.route");
const user_route_1 = require("@/app/modules/user/user.route");
const organization_route_1 = require("@/app/modules/organization/organization.route");
const organization_admin_route_1 = require("@/app/modules/organization/organization.admin.route");
const router = (0, express_1.Router)();
router.get("/health", (_req, res) => {
    res.json({ success: true, message: "Hello World — Invo server is running 🚀" });
});
router.use("/auth", auth_route_1.AuthRoutes);
router.use("/users", user_route_1.UserRoutes);
router.use("/organizations", organization_route_1.OrgRoutes);
router.use("/admin/organizations", organization_admin_route_1.AdminOrgRoutes);
exports.default = router;
//# sourceMappingURL=index.js.map