"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgValidation = void 0;
const zod_1 = require("zod");
const createOrgSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ error: "Name is required" }).min(2, "Name must be at least 2 characters"),
        address: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email("Invalid email").optional().or(zod_1.z.literal("")),
        registerNumber: zod_1.z.string().optional(),
        gstNumber: zod_1.z.string().optional(),
        invoicePrefix: zod_1.z
            .string()
            .min(1, "Prefix must be at least 1 character")
            .max(10, "Prefix must be at most 10 characters")
            .optional(),
    }),
});
const updateOrgSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, "Name must be at least 2 characters").optional(),
        address: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email("Invalid email").optional().or(zod_1.z.literal("")),
        registerNumber: zod_1.z.string().optional(),
        gstNumber: zod_1.z.string().optional(),
        invoicePrefix: zod_1.z
            .string()
            .min(1)
            .max(10, "Prefix must be at most 10 characters")
            .optional(),
        nextInvoiceNumber: zod_1.z.number().int().positive().optional(),
    }),
});
const assignOrgSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.number({ error: "User ID is required" }).int().positive("User ID must be a positive integer"),
    }),
});
exports.OrgValidation = { createOrgSchema, updateOrgSchema, assignOrgSchema };
//# sourceMappingURL=organization.validation.js.map