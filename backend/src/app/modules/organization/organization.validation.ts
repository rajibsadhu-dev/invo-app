import { z } from "zod";

const createOrgSchema = z.object({
  body: z.object({
    name: z.string({ error: "Name is required" }).min(2, "Name must be at least 2 characters"),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    registerNumber: z.string().optional(),
    gstNumber: z.string().optional(),
    invoicePrefix: z
      .string()
      .min(1, "Prefix must be at least 1 character")
      .max(10, "Prefix must be at most 10 characters")
      .optional(),
  }),
});

const updateOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    registerNumber: z.string().optional(),
    gstNumber: z.string().optional(),
    invoicePrefix: z
      .string()
      .min(1)
      .max(10, "Prefix must be at most 10 characters")
      .optional(),
    nextInvoiceNumber: z.number().int().positive().optional(),
  }),
});

const assignOrgSchema = z.object({
  body: z.object({
    userId: z.number({ error: "User ID is required" }).int().positive("User ID must be a positive integer"),
  }),
});

export const OrgValidation = { createOrgSchema, updateOrgSchema, assignOrgSchema };
