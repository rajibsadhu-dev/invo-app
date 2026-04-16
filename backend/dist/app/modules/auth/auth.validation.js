"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidation = void 0;
const zod_1 = require("zod");
const loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({ error: "Email is required" })
            .email("Invalid email format"),
        password: zod_1.z.string({ error: "Password is required" }),
    }),
});
const refreshTokenSchema = zod_1.z.object({
    cookies: zod_1.z.object({
        refreshToken: zod_1.z.string({ error: "Refresh token is required" }),
    }),
});
exports.AuthValidation = { loginSchema, refreshTokenSchema };
//# sourceMappingURL=auth.validation.js.map