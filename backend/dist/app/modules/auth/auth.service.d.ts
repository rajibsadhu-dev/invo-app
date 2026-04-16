import { ILoginPayload, ILoginResponse, IRefreshTokenResponse } from "@/app/modules/user/user.interface";
export declare const AuthService: {
    login: (payload: ILoginPayload) => Promise<ILoginResponse & {
        refreshToken: string;
    }>;
    refreshToken: (token: string) => Promise<IRefreshTokenResponse>;
    logout: (token: string) => Promise<void>;
};
//# sourceMappingURL=auth.service.d.ts.map