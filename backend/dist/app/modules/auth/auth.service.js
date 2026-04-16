"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("@/lib/prisma"));
const ApiError_1 = __importDefault(require("@/app/errors/ApiError"));
const jwtHelper_1 = require("@/helpers/jwtHelper");
const config_1 = __importDefault(require("@/config"));
const login = async (payload) => {
    const { email, password } = payload;
    const user = await prisma_1.default.user.findUnique({ where: { email } });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User does not exist");
    }
    const isMatch = await bcrypt_1.default.compare(password, user.password);
    if (!isMatch) {
        throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "Incorrect password");
    }
    const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };
    const accessToken = jwtHelper_1.jwtHelpers.createToken(tokenPayload, config_1.default.jwt.secret, config_1.default.jwt.expires_in);
    const refreshToken = jwtHelper_1.jwtHelpers.createToken(tokenPayload, config_1.default.jwt.refresh_secret, config_1.default.jwt.refresh_expires_in);
    const refreshExpiryDays = parseInt(config_1.default.jwt.refresh_expires_in) || 7;
    const expiresAt = new Date(Date.now() + refreshExpiryDays * 24 * 60 * 60 * 1000);
    await prisma_1.default.refreshToken.create({
        data: {
            userId: user.id,
            token: refreshToken,
            expiresAt,
        },
    });
    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    };
};
const refreshToken = async (token) => {
    if (!token) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Refresh token is required");
    }
    const storedToken = await prisma_1.default.refreshToken.findUnique({
        where: { token },
    });
    if (!storedToken || storedToken.expiresAt < new Date()) {
        if (storedToken) {
            await prisma_1.default.refreshToken.delete({ where: { token } });
        }
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Refresh token is invalid or expired");
    }
    let decoded;
    try {
        decoded = jwtHelper_1.jwtHelpers.verifyToken(token, config_1.default.jwt.refresh_secret);
    }
    catch {
        await prisma_1.default.refreshToken.delete({ where: { token } });
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Refresh token expired. Please login again.");
    }
    const user = await prisma_1.default.user.findUnique({ where: { id: Number(decoded.id) } });
    if (!user) {
        await prisma_1.default.refreshToken.delete({ where: { token } });
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User does not exist");
    }
    const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };
    const newAccessToken = jwtHelper_1.jwtHelpers.createToken(tokenPayload, config_1.default.jwt.secret, config_1.default.jwt.expires_in);
    return { accessToken: newAccessToken };
};
const logout = async (token) => {
    if (token) {
        await prisma_1.default.refreshToken.deleteMany({ where: { token } });
    }
};
exports.AuthService = { login, refreshToken, logout };
//# sourceMappingURL=auth.service.js.map