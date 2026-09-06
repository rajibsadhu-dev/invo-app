import { Router } from "express";
import validateRequest from "@/app/middlewares/validateRequest";
import auth from "@/app/middlewares/auth";
import { authLimiter } from "@/app/middlewares/rateLimiter";
import { AuthValidation } from "./auth.validation";
import { AuthController } from "./auth.controller";
import { InviteController } from "@/app/modules/organization/invite.controller";
import { InviteValidation } from "@/app/modules/organization/invite.validation";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validateRequest(AuthValidation.registerSchema),
  AuthController.register
);

router.post(
  "/login",
  authLimiter,
  validateRequest(AuthValidation.loginSchema),
  AuthController.login
);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/logout", AuthController.logout);

// ─── Password reset ──────────────────────────────────
router.post(
  "/forgot-password",
  authLimiter,
  validateRequest(AuthValidation.forgotPasswordSchema),
  AuthController.forgotPassword
);

router.post(
  "/reset-password",
  authLimiter,
  validateRequest(AuthValidation.resetPasswordSchema),
  AuthController.resetPassword
);

// ─── Email verification ──────────────────────────────
router.get("/verify-email", AuthController.verifyEmail);

router.post(
  "/resend-verification",
  auth(),
  authLimiter,
  AuthController.resendVerification
);

// ─── Invitations ─────────────────────────────────────
router.get("/invite-info", InviteController.getInviteInfo);

router.post(
  "/accept-invite",
  auth(),
  validateRequest(InviteValidation.acceptInviteSchema),
  InviteController.acceptInvite
);

// ─── Self-service (any authenticated role) ────────────
router.get("/me", auth(), AuthController.getMe);

router.patch(
  "/me",
  auth(),
  validateRequest(AuthValidation.updateMeSchema),
  AuthController.updateMe
);

router.post(
  "/change-password",
  auth(),
  authLimiter,
  validateRequest(AuthValidation.changePasswordSchema),
  AuthController.changePassword
);

export const AuthRoutes = router;
