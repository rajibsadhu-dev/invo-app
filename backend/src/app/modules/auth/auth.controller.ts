import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import { AuthService } from "./auth.service";
import {
  REFRESH_COOKIE,
  clearRefreshCookieOptions,
  refreshCookieOptions,
} from "@/helpers/cookie";

const login = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken, ...result } = await AuthService.login(req.body);

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Login successful",
    // The refresh token lives in the httpOnly cookie only — never in the JSON body,
    // where the SPA could persist it to localStorage.
    data: result,
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  const result = await AuthService.refreshToken(token);

  // Rotation: the old cookie value is now revoked, so replace it.
  res.cookie(REFRESH_COOKIE, result.refreshToken, refreshCookieOptions());

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Token refreshed successfully",
    data: { accessToken: result.accessToken },
  });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  await AuthService.logout(req.cookies?.[REFRESH_COOKIE]);

  res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions());

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged out successfully",
    data: null,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.getMe(req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User profile retrieved",
    data: result,
  });
});

const updateMe = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.updateMe(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.changePassword(req.user!.id, req.body);

  // Every session was revoked, this one included.
  res.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions());

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully. Please log in again.",
    data: null,
  });
});

export const AuthController = {
  login,
  refreshToken,
  logout,
  getMe,
  updateMe,
  changePassword,
};
