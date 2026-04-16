"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("@/shared/catchAsync"));
const sendResponse_1 = __importDefault(require("@/shared/sendResponse"));
const organization_service_1 = require("./organization.service");
const createOrganization = (0, catchAsync_1.default)(async (req, res) => {
    const ownerId = req.user.id;
    const result = await organization_service_1.OrgService.createOrganization(ownerId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Organization created successfully",
        data: result,
    });
});
const getMyOrganizations = (0, catchAsync_1.default)(async (req, res) => {
    const ownerId = req.user.id;
    const result = await organization_service_1.OrgService.getMyOrganizations(ownerId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Organizations retrieved successfully",
        data: result,
    });
});
const getOrganizationById = (0, catchAsync_1.default)(async (req, res) => {
    // org already fetched & verified by ownershipGuard
    const result = req.org;
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Organization retrieved successfully",
        data: result,
    });
});
const updateOrganization = (0, catchAsync_1.default)(async (req, res) => {
    const id = Number(req.params.id);
    const result = await organization_service_1.OrgService.updateOrganization(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Organization updated successfully",
        data: result,
    });
});
const deleteOrganization = (0, catchAsync_1.default)(async (req, res) => {
    const id = Number(req.params.id);
    await organization_service_1.OrgService.deleteOrganization(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Organization deleted successfully",
        data: null,
    });
});
const uploadLogo = (0, catchAsync_1.default)(async (req, res) => {
    if (!req.file) {
        return (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.BAD_REQUEST,
            success: false,
            message: "No file uploaded",
            data: null,
        });
    }
    const id = Number(req.params.id);
    const result = await organization_service_1.OrgService.updateLogo(id, req.file.filename);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Logo uploaded successfully",
        data: result,
    });
});
const getAllOrganizations = (0, catchAsync_1.default)(async (req, res) => {
    const search = req.query.search;
    const result = await organization_service_1.OrgService.getAllOrganizations(search);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "All organizations retrieved successfully",
        data: result,
    });
});
const assignOrganization = (0, catchAsync_1.default)(async (req, res) => {
    const orgId = Number(req.params.id);
    const { userId } = req.body;
    const result = await organization_service_1.OrgService.assignOrganization(orgId, userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Organization assigned successfully",
        data: result,
    });
});
exports.OrgController = {
    createOrganization,
    getMyOrganizations,
    getOrganizationById,
    updateOrganization,
    deleteOrganization,
    uploadLogo,
    getAllOrganizations,
    assignOrganization,
};
//# sourceMappingURL=organization.controller.js.map