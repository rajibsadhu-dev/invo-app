"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = __importDefault(require("@/lib/prisma"));
const ApiError_1 = __importDefault(require("@/app/errors/ApiError"));
/**
 * Verifies the authenticated user owns the organization at req.params.id.
 * Superadmin bypasses this check and can access any organization.
 * Attaches the org to req for downstream use: (req as any).org
 */
const ownershipGuard = async (req, _res, next) => {
    try {
        const orgId = Number(req.params.id);
        const userId = req.user?.id;
        if (!orgId || isNaN(orgId)) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Invalid organization ID");
        }
        const org = await prisma_1.default.organization.findUnique({ where: { id: orgId } });
        if (!org) {
            throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Organization not found");
        }
        // Superadmin bypasses ownership check
        const role = req.user?.role;
        if (role !== "superadmin" && org.ownerId !== userId) {
            throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "You do not have permission to access this organization");
        }
        req.org = org;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.default = ownershipGuard;
//# sourceMappingURL=ownershipGuard.js.map