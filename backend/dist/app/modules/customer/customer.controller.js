"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("@/shared/catchAsync"));
const sendResponse_1 = __importDefault(require("@/shared/sendResponse"));
const customer_service_1 = require("./customer.service");
const createCustomer = (0, catchAsync_1.default)(async (req, res) => {
    const organizationId = Number(req.params.id);
    const result = await customer_service_1.CustomerService.createCustomer(organizationId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Customer created successfully",
        data: result,
    });
});
const getCustomers = (0, catchAsync_1.default)(async (req, res) => {
    const organizationId = Number(req.params.id);
    const { search, page, limit, sortBy, sortOrder } = req.query;
    const result = await customer_service_1.CustomerService.getCustomers(organizationId, {
        search,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy,
        sortOrder: sortOrder === "asc" ? "asc" : sortOrder === "desc" ? "desc" : undefined,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Customers retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});
const getCustomerById = (0, catchAsync_1.default)(async (req, res) => {
    const organizationId = Number(req.params.id);
    const customerId = Number(req.params.customerId);
    const result = await customer_service_1.CustomerService.getCustomerById(organizationId, customerId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Customer retrieved successfully",
        data: result,
    });
});
const updateCustomer = (0, catchAsync_1.default)(async (req, res) => {
    const organizationId = Number(req.params.id);
    const customerId = Number(req.params.customerId);
    const result = await customer_service_1.CustomerService.updateCustomer(organizationId, customerId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Customer updated successfully",
        data: result,
    });
});
const deleteCustomer = (0, catchAsync_1.default)(async (req, res) => {
    const organizationId = Number(req.params.id);
    const customerId = Number(req.params.customerId);
    await customer_service_1.CustomerService.deleteCustomer(organizationId, customerId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Customer deleted successfully",
        data: null,
    });
});
exports.CustomerController = {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
};
//# sourceMappingURL=customer.controller.js.map