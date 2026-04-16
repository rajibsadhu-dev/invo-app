import { z } from "zod";

const createCustomerSchema = z.object({
  body: z.object({
    name: z.string({ error: "Name is required" }).min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    gstNumber: z.string().optional(),
  }),
});

const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    gstNumber: z.string().optional(),
  }),
});

export const CustomerValidation = { createCustomerSchema, updateCustomerSchema };
