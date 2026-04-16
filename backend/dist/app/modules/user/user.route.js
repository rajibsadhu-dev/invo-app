"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = require("express");
const validateRequest_1 = __importDefault(require("@/app/middlewares/validateRequest"));
const auth_1 = __importDefault(require("@/app/middlewares/auth"));
const user_validation_1 = require("./user.validation");
const user_controller_1 = require("./user.controller");
const router = (0, express_1.Router)();
// All user management routes require superadmin role
router.post("/", (0, auth_1.default)("superadmin"), (0, validateRequest_1.default)(user_validation_1.UserValidation.createUserSchema), user_controller_1.UserController.createUser);
router.get("/", (0, auth_1.default)("superadmin"), user_controller_1.UserController.getAllUsers);
router.get("/:id", (0, auth_1.default)("superadmin"), user_controller_1.UserController.getUserById);
router.patch("/:id", (0, auth_1.default)("superadmin"), (0, validateRequest_1.default)(user_validation_1.UserValidation.updateUserSchema), user_controller_1.UserController.updateUser);
router.delete("/:id", (0, auth_1.default)("superadmin"), user_controller_1.UserController.deleteUser);
exports.UserRoutes = router;
//# sourceMappingURL=user.route.js.map