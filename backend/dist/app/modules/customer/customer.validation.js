"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerValidation = void 0;
const zod_1 = require("zod");
const createCustomerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ error: "Name is required" }).min(2, "Name must be at least 2 characters"),
        email: zod_1.z.string().email("Invalid email").optional().or(zod_1.z.literal("")),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        gstNumber: zod_1.z.string().optional(),
    }),
});
const updateCustomerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, "Name must be at least 2 characters").optional(),
        email: zod_1.z.string().email("Invalid email").optional().or(zod_1.z.literal("")),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        gstNumber: zod_1.z.string().optional(),
    }),
});
exports.CustomerValidation = { createCustomerSchema, updateCustomerSchema };
//# sourceMappingURL=customer.validation.js.map