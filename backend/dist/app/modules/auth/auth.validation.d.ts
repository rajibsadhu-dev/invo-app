import { z } from "zod";
export declare const AuthValidation: {
    loginSchema: z.ZodObject<{
        body: z.ZodObject<{
            email: z.ZodString;
            password: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>;
    refreshTokenSchema: z.ZodObject<{
        cookies: z.ZodObject<{
            refreshToken: z.ZodString;
        }, z.core.$strip>;
    }, z.core.$strip>;
};
//# sourceMappingURL=auth.validation.d.ts.map