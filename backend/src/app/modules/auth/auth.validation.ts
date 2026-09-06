import { z } from "zod";

const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ error: "Name is required" })
      .min(2, "Name must be at least 2 characters"),
    email: z
      .string({ error: "Email is required" })
      .email("Invalid email format"),
    password: z
      .string({ error: "Password is required" })
      .min(8, "Password must be at least 8 characters"),
    orgName: z
      .string({ error: "Organization name is required" })
      .min(2, "Organization name must be at least 2 characters"),
  }),
});

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

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string({ error: "Email is required" }).email("Invalid email format"),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string({ error: "Reset token is required" }).min(1),
    newPassword: z
      .string({ error: "New password is required" })
      .min(8, "Password must be at least 8 characters"),
  }),
});

export const AuthValidation = {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateMeSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
