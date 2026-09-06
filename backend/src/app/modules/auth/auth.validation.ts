import { z } from "zod";

const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ error: "Email is required" })
      .email("Invalid email format"),
    password: z.string({ error: "Password is required" }).min(1, "Password is required"),
  }),
});

const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({ error: "Refresh token is required" }),
  }),
});

const updateMeSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email format").optional(),
    phone: z.string().max(20, "Phone must be at most 20 characters").optional(),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string({ error: "Current password is required" }).min(1),
    newPassword: z
      .string({ error: "New password is required" })
      .min(8, "New password must be at least 8 characters"),
  }),
});

export const AuthValidation = {
  loginSchema,
  refreshTokenSchema,
  updateMeSchema,
  changePasswordSchema,
};
