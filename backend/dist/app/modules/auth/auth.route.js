"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = require("express");
const validateRequest_1 = __importDefault(require("@/app/middlewares/validateRequest"));
const auth_validation_1 = require("./auth.validation");
const auth_controller_1 = require("./auth.controller");
const auth_1 = __importDefault(require("@/app/middlewares/auth"));
const router = (0, express_1.Router)();
router.post("/login", (0, validateRequest_1.default)(auth_validation_1.AuthValidation.loginSchema), auth_controller_1.AuthController.login);
router.post("/refresh-token", auth_controller_1.AuthController.refreshToken);
router.post("/logout", auth_controller_1.AuthController.logout);
router.get("/me", (0, auth_1.default)(), auth_controller_1.AuthController.getMe);
exports.AuthRoutes = router;
//# sourceMappingURL=auth.route.js.map