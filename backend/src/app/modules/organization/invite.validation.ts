import { z } from "zod";

const createInviteSchema = z.object({
  body: z.object({
    email: z.string({ error: "Email is required" }).email("Invalid email format"),
    role: z.enum(["admin", "manager", "staff", "viewer"], {
      error: 'Role must be "admin", "manager", "staff", or "viewer"',
    }),
  }),
});

const acceptInviteSchema = z.object({
  body: z.object({
    token: z.string({ error: "Invite token is required" }).min(1),
  }),
});

export const InviteValidation = {
  createInviteSchema,
  acceptInviteSchema,
};
