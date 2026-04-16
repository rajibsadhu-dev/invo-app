"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const config_1 = __importDefault(require("@/config"));
const ApiError_1 = __importDefault(require("@/app/errors/ApiError"));
const handleZodError_1 = __importDefault(require("@/app/errors/handleZodError"));
const handlePrismaError_1 = __importDefault(require("@/app/errors/handlePrismaError"));
const globalErrorHandler = (err, _req, res, _next) => {
    let statusCode = http_status_1.default.INTERNAL_SERVER_ERROR;
    let message = "Something went wrong!";
    let errorMessages = [];
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        const simplified = (0, handlePrismaError_1.default)(err);
        statusCode = simplified.statusCode;
        message = simplified.message;
        errorMessages = simplified.errorMessages;
    }
    else if (err instanceof zod_1.ZodError) {
        const simplified = (0, handleZodError_1.default)(err);
        statusCode = simplified.statusCode;
        message = simplified.message;
        errorMessages = simplified.errorMessages;
    }
    else if (err instanceof ApiError_1.default) {
        statusCode = err.statusCode;
        message = err.message;
        errorMessages = err.message ? [{ path: "", message: err.message }] : [];
    }
    else if (err instanceof Error) {
        message = err.message;
        errorMessages = err.message ? [{ path: "", message: err.message }] : [];
    }
    res.status(statusCode).json({
        success: false,
        message,
        errorMessages,
        stack: config_1.default.env !== "production" ? err?.stack : undefined,
    });
};
exports.default = globalErrorHandler;
//# sourceMappingURL=globalErrorHandler.js.map