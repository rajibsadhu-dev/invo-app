import httpStatus from "http-status";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import ApiError from "@/app/errors/ApiError";
import {
  IChangePasswordPayload,
  ILoginPayload,
  ILoginResponse,
  IUpdateMePayload,
} from "@/app/modules/user/user.interface";
import { jwtHelpers } from "@/helpers/jwtHelper";
import config from "@/config";

/**
 * Compared against when no user matches, so a miss costs the same wall-clock time as a
 * wrong password. Without it, response timing distinguishes "no such account" from
 * "wrong password" even when the message does not.
 */
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", config.bcrypt_salt_rounds);

const INVALID_CREDENTIALS = "Invalid email or password";

const issueTokens = (user: { id: number; email: string; role: string }) => {
  const payload = { id: user.id, email: user.email, role: user.role };

  const accessToken = jwtHelpers.createToken(
    payload,
    config.jwt.secret,
    config.jwt.expires_in
  );
  const refreshToken = jwtHelpers.createToken(
    payload,
    config.jwt.refresh_secret,
    config.jwt.refresh_expires_in
  );

  return { accessToken, refreshToken };
};

const persistRefreshToken = (userId: number, refreshToken: string) =>
  prisma.refreshToken.create({
    data: {
      userId,
      token: refreshToken,
      // Derived from the token's own exp claim, so the row can never disagree with the JWT.
      expiresAt: jwtHelpers.expiryOf(refreshToken),
    },
  });

const login = async (
  payload: ILoginPayload
): Promise<ILoginResponse & { refreshToken: string }> => {
  const { email, password } = payload;

  const user = await prisma.user.findUnique({ where: { email } });

  // Always run a comparison, then fail with one indistinguishable message. Returning
  // "user does not exist" separately from "incorrect password" is an enumeration oracle.
  const isMatch = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

  if (!user || !isMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, INVALID_CREDENTIALS);
  }

  const { accessToken, refreshToken } = issueTokens(user);
  await persistRefreshToken(user.id, refreshToken);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
};

/**
 * Rotating refresh: the presented token is consumed and replaced. A validly signed token
 * that is no longer stored means it was already rotated — i.e. someone replayed a stolen
 * copy — so the whole family is revoked and every session for that user ends.
 */
const refreshToken = async (
  token: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token is required");
  }

  let decoded;
  try {
    decoded = jwtHelpers.verifyToken(token, config.jwt.refresh_secret);
  } catch {
    await prisma.refreshToken.deleteMany({ where: { token } });
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Session expired. Please log in again."
    );
  }

  const userId = Number(decoded.id);
  const stored = await prisma.refreshToken.findUnique({ where: { token } });

  if (!stored) {
    // Signed correctly but not on file: replay of an already-rotated token.
    if (Number.isFinite(userId)) {
      await prisma.refreshToken.deleteMany({ where: { userId } });
    }
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Session is no longer valid. Please log in again."
    );
  }

  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token } });
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Session expired. Please log in again."
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
    throw new ApiError(httpStatus.UNAUTHORIZED, "Session is no longer valid.");
  }

  const issued = issueTokens(user);

  await prisma.$transaction([
    prisma.refreshToken.delete({ where: { token } }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: issued.refreshToken,
        expiresAt: jwtHelpers.expiryOf(issued.refreshToken),
      },
    }),
  ]);

  return issued;
};

const logout = async (token: string): Promise<void> => {
  if (token) {
    await prisma.refreshToken.deleteMany({ where: { token } });
  }
};

const getMe = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: true },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  return user;
};

/**
 * Self-service profile update. Deliberately cannot touch `role` or `password` — role
 * changes belong to the superadmin routes, password changes to changePassword below.
 */
const updateMe = async (userId: number, payload: IUpdateMePayload) => {
  if (payload.email) {
    const clash = await prisma.user.findFirst({
      where: { email: payload.email, NOT: { id: userId } },
      select: { id: true },
    });
    if (clash) {
      throw new ApiError(httpStatus.CONFLICT, "Email already in use");
    }
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      ...(payload.name !== undefined && { name: payload.name }),
      ...(payload.email !== undefined && { email: payload.email }),
      ...(payload.phone !== undefined && { phone: payload.phone || null }),
    },
    omit: { password: true },
  });
};

const changePassword = async (
  userId: number,
  payload: IChangePasswordPayload
): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const isMatch = await bcrypt.compare(payload.currentPassword, user.password);
  if (!isMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Current password is incorrect");
  }

  if (payload.currentPassword === payload.newPassword) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "New password must differ from the current password"
    );
  }

  const hashed = await bcrypt.hash(payload.newPassword, config.bcrypt_salt_rounds);

  // Changing a password ends every other session — that is the point of changing it.
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { password: hashed } }),
    prisma.refreshToken.deleteMany({ where: { userId } }),
  ]);
};

/** Housekeeping: expired rows are dead weight and are never read. */
const purgeExpiredRefreshTokens = async (): Promise<number> => {
  const { count } = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
};

export const AuthService = {
  login,
  refreshToken,
  logout,
  getMe,
  updateMe,
  changePassword,
  purgeExpiredRefreshTokens,
};
