import { Router } from "express";
import validateRequest from "@/app/middlewares/validateRequest";
import { AuthValidation } from "./auth.validation";
import { AuthController } from "./auth.controller";
import auth from "@/app/middlewares/auth";

const router = Router();

router.post(
  "/login",
  validateRequest(AuthValidation.loginSchema),
  AuthController.login
);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/logout", AuthController.logout);

router.get("/me", auth(), AuthController.getMe);

export const AuthRoutes = router;
