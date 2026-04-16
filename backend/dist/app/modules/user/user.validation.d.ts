import { z } from "zod";
export declare const UserValidation: {
    createUserSchema: z.ZodObject<{
        body: z.ZodObject<{
            name: z.ZodString;
            email: z.ZodString;
            password: z.ZodString;
            phone: z.ZodOptional<z.ZodString>;
            role: z.ZodDefault<z.ZodEnum<{
                user: "user";
                superadmin: "superadmin";
            }>>;
        }, z.core.$strip>;
    }, z.core.$strip>;
    updateUserSchema: z.ZodObject<{
        body: z.ZodObject<{
            name: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            password: z.ZodOptional<z.ZodString>;
            phone: z.ZodOptional<z.ZodString>;
            role: z.ZodOptional<z.ZodEnum<{
                user: "user";
                superadmin: "superadmin";
            }>>;
        }, z.core.$strip>;
    }, z.core.$strip>;
};
//# sourceMappingURL=user.validation.d.ts.map