import { z } from "zod";
export declare const OrgValidation: {
    createOrgSchema: z.ZodObject<{
        body: z.ZodObject<{
            name: z.ZodString;
            address: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            registerNumber: z.ZodOptional<z.ZodString>;
            gstNumber: z.ZodOptional<z.ZodString>;
            invoicePrefix: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    updateOrgSchema: z.ZodObject<{
        body: z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            address: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
            registerNumber: z.ZodOptional<z.ZodString>;
            gstNumber: z.ZodOptional<z.ZodString>;
            invoicePrefix: z.ZodOptional<z.ZodString>;
            nextInvoiceNumber: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    assignOrgSchema: z.ZodObject<{
        body: z.ZodObject<{
            userId: z.ZodNumber;
        }, z.core.$strip>;
    }, z.core.$strip>;
};
//# sourceMappingURL=organization.validation.d.ts.map