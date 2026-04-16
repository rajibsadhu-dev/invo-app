"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("@/shared/catchAsync"));
const sendResponse_1 = __importDefault(require("@/shared/sendResponse"));
const invoice_service_1 = require("./invoice.service");
const createInvoice = (0, catchAsync_1.default)(async (req, res) => {
    const organizationId = Number(req.params.id);
    const result = await invoice_service_1.InvoiceService.createInvoice(organizationId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "Invoice created successfully",
        data: result,
    });
});
const getInvoices = (0, catchAsync_1.default)(async (req, res) => {
    const organizationId = Number(req.params.id);
    const { status, customerId, search, page, limit, sortBy, sortOrder } = req.query;
    const result = await invoice_service_1.InvoiceService.getInvoices(organizationId, {
        status: status,
        customerId: customerId ? Number(customerId) : undefined,
        search,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy,
        sortOrder: sortOrder === "asc" ? "asc" : sortOrder === "desc" ? "desc" : undefined,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Invoices retrieved successfully",
        data: result.data,
        meta: result.meta,
    });
});
const getInvoiceById = (0, catchAsync_1.default)(async (req, res) => {
    const organizationId = Number(req.params.id);
    const invoiceId = Number(req.params.invoiceId);
    const result = await invoice_service_1.InvoiceService.getInvoiceById(organizationId, invoiceId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Invoice retrieved successfully",
        data: result,
    });
});
const updateInvoice = (0, catchAsync_1.default)(async (req, res) => {
    const organizationId = Number(req.params.id);
    const invoiceId = Number(req.params.invoiceId);
    const result = await invoice_service_1.InvoiceService.updateInvoice(organizationId, invoiceId, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Invoice updated successfully",
        data: result,
    });
});
const deleteInvoice = (0, catchAsync_1.default)(async (req, res) => {
    const organizationId = Number(req.params.id);
    const invoiceId = Number(req.params.invoiceId);
    await invoice_service_1.InvoiceService.deleteInvoice(organizationId, invoiceId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Invoice deleted successfully",
        data: null,
    });
});
exports.InvoiceController = {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice,
};
//# sourceMappingURL=invoice.controller.js.map