"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("@/shared/catchAsync"));
const sendResponse_1 = __importDefault(require("@/shared/sendResponse"));
const user_service_1 = require("./user.service");
const createUser = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserService.createUser(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "User created successfully",
        data: result,
    });
});
const getAllUsers = (0, catchAsync_1.default)(async (_req, res) => {
    const result = await user_service_1.UserService.getAllUsers();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Users retrieved successfully",
        data: result,
    });
});
const getUserById = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserService.getUserById(Number(req.params.id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User retrieved successfully",
        data: result,
    });
});
const updateUser = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserService.updateUser(Number(req.params.id), req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User updated successfully",
        data: result,
    });
});
const deleteUser = (0, catchAsync_1.default)(async (req, res) => {
    const result = await user_service_1.UserService.deleteUser(Number(req.params.id));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "User deleted successfully",
        data: result,
    });
});
exports.UserController = {
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
};
//# sourceMappingURL=user.controller.js.map