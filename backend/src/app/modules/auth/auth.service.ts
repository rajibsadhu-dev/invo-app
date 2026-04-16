import httpStatus from "http-status";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";
import {
  ILoginPayload,
  ILoginResponse,
  IRefreshTokenResponse,
} from "@/app/modules/user/user.interface";
import { jwtHelpers } from "@/helpers/jwtHelper";
import config from "@/config";

const login = async (
  payload: ILoginPayload
): Promise<ILoginResponse & { refreshToken: string }> => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not exist");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect password");
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.secret,
    config.jwt.expires_in
  );

  const refreshToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );

  const refreshExpiryDays = parseInt(config.jwt.refresh_expires_in) || 7;
  const expiresAt = new Date(
    Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000
  );

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

const refreshToken = async (token: string): Promise<IRefreshTokenResponse> => {
  if (!token) {
    throw new ApiError(httpStatus.FORBIDDEN, "Refresh token is required");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
  });
  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) {
      await prisma.refreshToken.delete({ where: { token } });
    }
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Refresh token is invalid or expired"
    );
  }

  let decoded;
  try {
    decoded = jwtHelpers.verifyToken(token, config.jwt.refresh_secret);
  } catch {
    await prisma.refreshToken.delete({ where: { token } });
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Refresh token expired. Please login again."
    );
  }

  const user = await prisma.user.findUnique({ where: { id: Number(decoded.id) } });
  if (!user) {
    await prisma.refreshToken.delete({ where: { token } });
    throw new ApiError(httpStatus.NOT_FOUND, "User does not exist");
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const newAccessToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.secret,
    config.jwt.expires_in
  );

  return { accessToken: newAccessToken };
};

const logout = async (token: string): Promise<void> => {
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }
};

export const AuthService = { login, refreshToken, logout };
