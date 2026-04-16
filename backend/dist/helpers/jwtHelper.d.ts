import { JwtPayload } from "jsonwebtoken";
export declare const jwtHelpers: {
    createToken: (payload: Record<string, unknown>, secret: string, expiresIn: string) => string;
    verifyToken: (token: string, secret: string) => JwtPayload;
};
//# sourceMappingURL=jwtHelper.d.ts.map