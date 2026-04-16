import { z } from "zod";

const createUserSchema = z.object({
  body: z.object({
    name: z
      .string({ error: "Name is required" })
      .min(2, "Name must be at least 2 characters"),
    email: z
      .string({ error: "Email is required" })
      .email("Invalid email format"),
    password: z
      .string({ error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
    phone: z.string().optional(),
    role: z.enum(["superadmin", "user"]).default("user"),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email format").optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    phone: z.string().optional(),
    role: z.enum(["superadmin", "user"]).optional(),
  }),
});

export const UserValidation = { createUserSchema, updateUserSchema };
