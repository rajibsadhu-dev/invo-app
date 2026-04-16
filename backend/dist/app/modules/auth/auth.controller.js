"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("@/shared/catchAsync"));
const sendResponse_1 = __importDefault(require("@/shared/sendResponse"));
const auth_service_1 = require("./auth.service");
const config_1 = __importDefault(require("@/config"));
const login = (0, catchAsync_1.default)(async (req, res) => {
    const result = await auth_service_1.AuthService.login(req.body);
    // Set refresh token in httpOnly cookie
    res.cookie("refreshToken", result.refreshToken, {
        secure: config_1.default.env === "production",
        httpOnly: true,
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Login successful",
        data: result,
    });
});
const refreshToken = (0, catchAsync_1.default)(async (req, res) => {
    const token = req.cookies.refreshToken;
    const result = await auth_service_1.AuthService.refreshToken(token);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Token refreshed successfully",
        data: result,
    });
});
const logout = (0, catchAsync_1.default)(async (req, res) => {
    const token = req.cookies.refreshToken;
    // Delete refresh token from DB
    await auth_service_1.AuthService.logout(token);
    // Clear cookie
    res.clearCookie("refreshToken", {
        secure: config_1.default.env === "production",
        httpOnly: true,
        sameSite: "strict",
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Logged out successfully",
        data: null,
    });
});
const getMe = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.user;
    const prisma = (await Promise.resolve().then(() => __importStar(require("@/lib/prisma")))).default;
    const user = await prisma.user.findUnique({
        where: { id: Number(id) },
        omit: { password: true },
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User profile retrieved",
        data: user,
    });
});
exports.AuthController = { login, refreshToken, logout, getMe };
//# sourceMappingURL=auth.controller.js.map