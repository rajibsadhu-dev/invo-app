import httpStatus from "http-status";
import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import config from "@/config";
import ApiError from "@/app/errors/ApiError";
import { IUser } from "./user.interface";

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

  const user = await prisma.user.create({
    data: { ...payload, password: hashedPassword },
    omit: { password: true },
  });

  return user;
};

const getAllUsers = async () => {
  return prisma.user.findMany({ omit: { password: true } });
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

const updateUser = async (id: number, payload: Partial<IUser>) => {
  if (payload.email) {
    const existing = await prisma.user.findFirst({
      where: { email: payload.email, NOT: { id } },
    });
    if (existing) {
      throw new ApiError(httpStatus.CONFLICT, "Email already in use");
    }
  }

  if (payload.password) {
    payload.password = await bcrypt.hash(
      payload.password,
      config.bcrypt_salt_rounds
    );
  }

  const user = await prisma.user.update({
    where: { id },
    data: payload,
    omit: { password: true },
  });

  return user;
};

const deleteUser = async (id: number) => {
  const user = await prisma.user.delete({ where: { id } });
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const UserService = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
