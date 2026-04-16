import { z } from "zod";

const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ error: "Email is required" })
      .email("Invalid email format"),
    password: z.string({ error: "Password is required" }),
  }),
});

const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({ error: "Refresh token is required" }),
  }),
});

export const AuthValidation = { loginSchema, refreshTokenSchema };
