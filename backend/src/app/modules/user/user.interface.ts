export type UserRole = "superadmin" | "user";

export type IUser = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
};

export type ILoginPayload = {
  email: string;
  password: string;
};

export type ILoginResponse = {
  accessToken: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
};

export type IRefreshTokenResponse = {
  accessToken: string;
};
