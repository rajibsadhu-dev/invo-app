import httpStatus from "http-status";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import config from "@/config";
import ApiError from "@/app/errors/ApiError";
import { IUser } from "./user.interface";

const assertNotRootSuperadmin = (targetId: number): void => {
  if (config.super_admin.id && targetId === config.super_admin.id) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "The root superadmin account cannot be modified or deleted"
    );
  }
};

const assertNotLastSuperadmin = async (targetId: number): Promise<void> => {
  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { role: true },
  });

  if (target?.role !== "superadmin") return;

  const superadmins = await prisma.user.count({ where: { role: "superadmin" } });
  if (superadmins <= 1) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot remove the last superadmin. Promote another user first."
    );
  }
};

const createUser = async (payload: IUser) => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, "Email already exists");
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    config.bcrypt_salt_rounds
  );

  return prisma.user.create({
    data: { ...payload, password: hashedPassword },
    omit: { password: true },
  });
};

const getAllUsers = async () => {
  return prisma.user.findMany({
    omit: { password: true },
    orderBy: { createdAt: "desc" },
  });
};

const getUserById = async (id: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
    omit: { password: true },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  return user;
};

const updateUser = async (
  id: number,
  payload: Partial<IUser>,
  actorId: number
) => {
  await getUserById(id);

  if (payload.email) {
    const existing = await prisma.user.findFirst({
      where: { email: payload.email, NOT: { id } },
      select: { id: true },
    });
    if (existing) {
      throw new ApiError(httpStatus.CONFLICT, "Email already in use");
    }
  }

  if (payload.role && payload.role !== "superadmin") {
    assertNotRootSuperadmin(id);
    await assertNotLastSuperadmin(id);
  }

  if (id === actorId && payload.role && payload.role !== "superadmin") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You cannot remove your own superadmin role"
    );
  }

  const data: Partial<IUser> = { ...payload };
  if (data.password) {
    data.password = await bcrypt.hash(data.password, config.bcrypt_salt_rounds);
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    omit: { password: true },
  });

  // A password reset by an administrator must invalidate the target's live sessions.
  if (payload.password) {
    await prisma.refreshToken.deleteMany({ where: { userId: id } });
  }

  return user;
};

const deleteUser = async (id: number, actorId: number) => {
  if (id === actorId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot delete your own account");
  }

  assertNotRootSuperadmin(id);
  await getUserById(id);
  await assertNotLastSuperadmin(id);

  const user = await prisma.user.delete({ where: { id }, omit: { password: true } });
  return user;
};

export const UserService = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
