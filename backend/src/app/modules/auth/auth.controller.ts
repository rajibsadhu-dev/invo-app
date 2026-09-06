import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "@/shared/catchAsync";
import sendResponse from "@/shared/sendResponse";
import ApiError from "@/app/errors/ApiError";
import { AuthService } from "./auth.service";
import {
  REFRESH_COOKIE,
  clearRefreshCookieOptions,
  refreshCookieOptions,
} from "@/helpers/cookie";

const register = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken, ...result } = await AuthService.register(req.body);

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Registration successful",
    data: result,
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken, ...result } = await AuthService.login(req.body);

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Login successful",
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

const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  const token = req.query.token as string;
  if (!token) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Verification token is required");
  }

  await AuthService.verifyEmail(token);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Email verified successfully",
    data: null,
  });
});

const resendVerification = catchAsync(async (req: Request, res: Response) => {
  await AuthService.resendVerification(req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Verification email sent",
    data: null,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.forgotPassword(req.body.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "If that email is registered, a reset link has been sent",
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthService.resetPassword(req.body.token, req.body.newPassword);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully. Please sign in with your new password.",
    data: null,
  });
});

export const AuthController = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  updateMe,
  changePassword,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
};
