"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("@/lib/prisma"));
const ApiError_1 = __importDefault(require("@/app/errors/ApiError"));
const createOrganization = async (ownerId, payload) => {
    const org = await prisma_1.default.organization.create({
        data: {
            ...payload,
            ownerId,
            email: payload.email || null,
            invoicePrefix: payload.invoicePrefix || "INV",
        },
    });
    return org;
};
const getMyOrganizations = async (ownerId) => {
    return prisma_1.default.organization.findMany({
        where: { ownerId },
        orderBy: { createdAt: "desc" },
    });
};
const getOrganizationById = async (id) => {
    const org = await prisma_1.default.organization.findUnique({ where: { id } });
    if (!org) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Organization not found");
    }
    return org;
};
const updateOrganization = async (id, payload) => {
    return prisma_1.default.organization.update({
        where: { id },
        data: {
            ...payload,
            // Only coerce email to null when it's explicitly provided as an empty string
            ...(payload.email !== undefined && { email: payload.email || null }),
        },
    });
};
const deleteOrganization = async (id) => {
    // Delete logo file if it exists
    const org = await prisma_1.default.organization.findUnique({ where: { id } });
    if (org?.logo) {
        const logoPath = path_1.default.join(process.cwd(), org.logo);
        if (fs_1.default.existsSync(logoPath))
            fs_1.default.unlinkSync(logoPath);
    }
    return prisma_1.default.organization.delete({ where: { id } });
};
const updateLogo = async (id, filename) => {
    // Delete old logo file if it exists
    const org = await prisma_1.default.organization.findUnique({ where: { id } });
    if (org?.logo) {
        const oldPath = path_1.default.join(process.cwd(), org.logo);
        if (fs_1.default.existsSync(oldPath))
            fs_1.default.unlinkSync(oldPath);
    }
    const logoUrl = `uploads/logos/${filename}`;
    return prisma_1.default.organization.update({ where: { id }, data: { logo: logoUrl } });
};
const getAllOrganizations = async (search) => {
    return prisma_1.default.organization.findMany({
        where: search
            ? {
                OR: [
                    { name: { contains: search } },
                    { owner: { name: { contains: search } } },
                    { owner: { email: { contains: search } } },
                ],
            }
            : undefined,
        include: {
            owner: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
    });
};
const assignOrganization = async (orgId, userId) => {
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    return prisma_1.default.organization.update({
        where: { id: orgId },
        data: { ownerId: userId },
        include: {
            owner: { select: { id: true, name: true, email: true } },
        },
    });
};
exports.OrgService = {
    createOrganization,
    getMyOrganizations,
    getOrganizationById,
    updateOrganization,
    deleteOrganization,
    updateLogo,
    getAllOrganizations,
    assignOrganization,
};
//# sourceMappingURL=organization.service.js.map