import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { AuthService } from "./auth.service";
import config from "@/config";

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.login(req.body);

  // Set refresh token in httpOnly cookie
  res.cookie("refreshToken", result.refreshToken, {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Login successful",
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  const result = await AuthService.refreshToken(token);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Token refreshed successfully",
    data: result,
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  // Delete refresh token from DB
  await AuthService.logout(token);

  // Clear cookie
  res.clearCookie("refreshToken", {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: "strict",
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out successfully",
    data: null,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const { id } = (req as any).user;
  const prisma = (await import("@/lib/prisma")).default;
  const user = await prisma.user.findUnique({
    where: { id: Number(id) },
    omit: { password: true },
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile retrieved",
    data: user,
  });
});

export const AuthController = { login, refreshToken, logout, getMe };
