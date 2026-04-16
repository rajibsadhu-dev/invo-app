"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceValidation = void 0;
const zod_1 = require("zod");
const invoiceItemSchema = zod_1.z.object({
    description: zod_1.z.string().min(1, "Description is required"),
    unit: zod_1.z.string().optional().nullable(),
    quantity: zod_1.z.number().positive("Quantity must be positive"),
    rate: zod_1.z.number().positive("Rate must be positive"),
});
const optionalFields = {
    invoiceDate: zod_1.z.coerce.date().optional(),
    tax: zod_1.z.number().min(0).optional(),
    discount: zod_1.z.number().min(0).optional(),
    receivedAmount: zod_1.z.number().min(0).optional(),
    // Reference fields
    challanNo: zod_1.z.string().optional().nullable(),
    vehicleNo: zod_1.z.string().optional().nullable(),
    siteLocation: zod_1.z.string().optional().nullable(),
    billingAddress: zod_1.z.string().optional().nullable(),
    referenceNumber: zod_1.z.string().optional().nullable(),
    // Payment
    paymentMethod: zod_1.z.enum(["cash", "bank", "upi"]).optional().nullable(),
    bankName: zod_1.z.string().optional().nullable(),
    bankAccount: zod_1.z.string().optional().nullable(),
    bankIfsc: zod_1.z.string().optional().nullable(),
    transactionNumber: zod_1.z.string().optional().nullable(),
    // Footer
    termsAndConditions: zod_1.z.string().optional().nullable(),
    notes: zod_1.z.string().optional().nullable(),
    authorizedSignatory: zod_1.z.string().optional().nullable(),
};
const createInvoiceSchema = zod_1.z.object({
    body: zod_1.z.object({
        customerId: zod_1.z.number({ message: "Customer is required" }).int().positive(),
        items: zod_1.z.array(invoiceItemSchema).min(1, "At least one item is required"),
        ...optionalFields,
    }),
});
const updateInvoiceSchema = zod_1.z.object({
    body: zod_1.z.object({
        customerId: zod_1.z.number().int().positive().optional(),
        items: zod_1.z.array(invoiceItemSchema).min(1).optional(),
        status: zod_1.z.enum(["draft", "sent", "paid", "cancelled"]).optional(),
        ...optionalFields,
    }),
});
exports.InvoiceValidation = { createInvoiceSchema, updateInvoiceSchema };
//# sourceMappingURL=invoice.validation.js.map