import { Router } from "express";
import validateRequest from "@/app/middlewares/validateRequest";
import auth from "@/app/middlewares/auth";
import { authLimiter } from "@/app/middlewares/rateLimiter";
import { AuthValidation } from "./auth.validation";
import { AuthController } from "./auth.controller";

const router = Router();

router.post(
  "/login",
  authLimiter,
  validateRequest(AuthValidation.loginSchema),
  AuthController.login
);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/logout", AuthController.logout);

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
