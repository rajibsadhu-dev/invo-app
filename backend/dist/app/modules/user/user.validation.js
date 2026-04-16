"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidation = void 0;
const zod_1 = require("zod");
const createUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string({ error: "Name is required" })
            .min(2, "Name must be at least 2 characters"),
        email: zod_1.z
            .string({ error: "Email is required" })
            .email("Invalid email format"),
        password: zod_1.z
            .string({ error: "Password is required" })
            .min(6, "Password must be at least 6 characters"),
        phone: zod_1.z.string().optional(),
        role: zod_1.z.enum(["superadmin", "user"]).default("user"),
    }),
});
const updateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, "Name must be at least 2 characters").optional(),
        email: zod_1.z.string().email("Invalid email format").optional(),
        password: zod_1.z
            .string()
            .min(6, "Password must be at least 6 characters")
            .optional(),
        phone: zod_1.z.string().optional(),
        role: zod_1.z.enum(["superadmin", "user"]).optional(),
    }),
});
exports.UserValidation = { createUserSchema, updateUserSchema };
//# sourceMappingURL=user.validation.js.map