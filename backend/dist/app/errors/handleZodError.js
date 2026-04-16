"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const handleZodError = (error) => {
    const errorMessages = error.issues.map((issue) => ({
        path: issue.path[issue.path.length - 1]?.toString() || "",
        message: issue.message,
    }));
    return {
        statusCode: http_status_1.default.BAD_REQUEST,
        message: "Validation Error",
        errorMessages,
    };
};
exports.default = handleZodError;
//# sourceMappingURL=handleZodError.js.map