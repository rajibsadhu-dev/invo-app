import { z } from "zod";

const updateRoleSchema = z.object({
  body: z.object({
    role: z.enum(["admin", "manager", "staff", "viewer"], {
      error: 'Role must be "admin", "manager", "staff", or "viewer"',
    }),
  }),
});

export const TeamValidation = {
  updateRoleSchema,
};
