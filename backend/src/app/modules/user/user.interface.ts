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
    emailVerifiedAt: Date | null;
  };
};

export type IRefreshTokenResponse = {
  accessToken: string;
};

/** Self-service profile edit. Intentionally excludes `role` and `password`. */
export type IUpdateMePayload = {
  name?: string;
  email?: string;
  phone?: string;
};

export type IChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};
