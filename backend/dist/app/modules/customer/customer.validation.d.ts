import { z } from "zod";
export declare const CustomerValidation: {
    createCustomerSchema: z.ZodObject<{
        body: z.ZodObject<{
            name: z.ZodString;
            email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            phone: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodString>;
            gstNumber: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    updateCustomerSchema: z.ZodObject<{
        body: z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            phone: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodString>;
            gstNumber: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
};
//# sourceMappingURL=customer.validation.d.ts.map