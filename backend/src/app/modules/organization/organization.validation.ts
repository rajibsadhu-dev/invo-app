import { z } from "zod";

const createOrgSchema = z.object({
  body: z.object({
    name: z.string({ error: "Name is required" }).min(2, "Name must be at least 2 characters"),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    registerNumber: z.string().optional(),
    gstNumber: z.string().optional(),
    stateCode: z
      .string()
      .regex(/^\d{2}$/, "State code must be two digits")
      .optional()
      .or(z.literal("")),
    businessType: z
      .string()
      .max(60, "Business type must be at most 60 characters")
      .optional()
      .or(z.literal("")),
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
    stateCode: z
      .string()
      .regex(/^\d{2}$/, "State code must be two digits")
      .optional()
      .or(z.literal("")),
    businessType: z
      .string()
      .max(60, "Business type must be at most 60 characters")
      .optional()
      .or(z.literal("")),
    invoicePrefix: z
      .string()
      .min(1)
      .max(10, "Prefix must be at most 10 characters")
      .optional(),
    nextInvoiceNumber: z.number().int().positive().optional(),
  }),
});

const invoiceFieldConfigSchema = z.object({
  challanNo: z.boolean().optional(),
  vehicleNo: z.boolean().optional(),
  siteLocation: z.boolean().optional(),
  billingAddress: z.boolean().optional(),
  qrVerification: z.boolean().optional(),
});

const updateInvoiceFieldConfigSchema = z.object({
  body: invoiceFieldConfigSchema,
});

const assignOrgSchema = z.object({
  body: z.object({
    userId: z.number({ error: "User ID is required" }).int().positive("User ID must be a positive integer"),
  }),
});

export const OrgValidation = { createOrgSchema, updateOrgSchema, updateInvoiceFieldConfigSchema, assignOrgSchema };
