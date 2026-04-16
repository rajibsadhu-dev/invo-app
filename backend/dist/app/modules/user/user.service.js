"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("@/lib/prisma"));
const config_1 = __importDefault(require("@/config"));
const ApiError_1 = __importDefault(require("@/app/errors/ApiError"));
const createUser = async (payload) => {
    const existing = await prisma_1.default.user.findUnique({
        where: { email: payload.email },
    });
    if (existing) {
        throw new ApiError_1.default(http_status_1.default.CONFLICT, "Email already exists");
    }
    const hashedPassword = await bcrypt_1.default.hash(payload.password, config_1.default.bcrypt_salt_rounds);
    const user = await prisma_1.default.user.create({
        data: { ...payload, password: hashedPassword },
        omit: { password: true },
    });
    return user;
};
const getAllUsers = async () => {
    return prisma_1.default.user.findMany({ omit: { password: true } });
};
const getUserById = async (id) => {
    const user = await prisma_1.default.user.findUnique({
        where: { id },
        omit: { password: true },
    });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not found");
    }
    return user;
};
const updateUser = async (id, payload) => {
    if (payload.email) {
        const existing = await prisma_1.default.user.findFirst({
            where: { email: payload.email, NOT: { id } },
        });
        if (existing) {
            throw new ApiError_1.default(http_status_1.default.CONFLICT, "Email already in use");
        }
    }
    if (payload.password) {
        payload.password = await bcrypt_1.default.hash(payload.password, config_1.default.bcrypt_salt_rounds);
    }
    const user = await prisma_1.default.user.update({
        where: { id },
        data: payload,
        omit: { password: true },
    });
    return user;
};
const deleteUser = async (id) => {
    const user = await prisma_1.default.user.delete({ where: { id } });
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
exports.UserService = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
};
//# sourceMappingURL=user.service.js.map