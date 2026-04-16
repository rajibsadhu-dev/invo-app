import { Router } from "express";
import validateRequest from "@/app/middlewares/validateRequest";
import auth from "@/app/middlewares/auth";
import { UserValidation } from "./user.validation";
import { UserController } from "./user.controller";

const router = Router();

// All user management routes require superadmin role
router.post(
  "/",
  auth("superadmin"),
  validateRequest(UserValidation.createUserSchema),
  UserController.createUser
);

router.get("/", auth("superadmin"), UserController.getAllUsers);

router.get("/:id", auth("superadmin"), UserController.getUserById);

router.patch(
  "/:id",
  auth("superadmin"),
  validateRequest(UserValidation.updateUserSchema),
  UserController.updateUser
);

router.delete("/:id", auth("superadmin"), UserController.deleteUser);

export const UserRoutes = router;
