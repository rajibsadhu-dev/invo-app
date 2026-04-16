"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceRoutes = void 0;
const express_1 = require("express");
const validateRequest_1 = __importDefault(require("@/app/middlewares/validateRequest"));
const invoice_validation_1 = require("./invoice.validation");
const invoice_controller_1 = require("./invoice.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.post("/", (0, validateRequest_1.default)(invoice_validation_1.InvoiceValidation.createInvoiceSchema), invoice_controller_1.InvoiceController.createInvoice);
router.get("/", invoice_controller_1.InvoiceController.getInvoices);
router.get("/:invoiceId", invoice_controller_1.InvoiceController.getInvoiceById);
router.patch("/:invoiceId", (0, validateRequest_1.default)(invoice_validation_1.InvoiceValidation.updateInvoiceSchema), invoice_controller_1.InvoiceController.updateInvoice);
router.delete("/:invoiceId", invoice_controller_1.InvoiceController.deleteInvoice);
exports.InvoiceRoutes = router;
//# sourceMappingURL=invoice.route.js.map