import { z } from "zod";

const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    gstNumber: z.string().max(15).optional().or(z.literal("")),
    stateCode: z
      .string()
      .regex(/^\d{2}$/, "State code must be two digits")
      .optional()
      .or(z.literal("")),
    contactPerson: z.string().optional(),
    notes: z.string().optional(),
  }),
});

const updateSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    gstNumber: z.string().max(15).optional().or(z.literal("")),
    stateCode: z
      .string()
      .regex(/^\d{2}$/, "State code must be two digits")
      .optional()
      .or(z.literal("")),
    contactPerson: z.string().optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const SupplierValidation = { createSupplierSchema, updateSupplierSchema };
