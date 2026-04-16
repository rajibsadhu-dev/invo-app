"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const handlePrismaError = (error) => {
    let statusCode = http_status_1.default.BAD_REQUEST;
    let message = "Database Error";
    const errorMessages = [];
    switch (error.code) {
        case "P2002": {
            statusCode = http_status_1.default.CONFLICT;
            message = "Unique constraint violation";
            const target = error.meta?.target || [];
            errorMessages.push({
                path: target.join(", "),
                message: `${target.join(", ")} already exists`,
            });
            break;
        }
        case "P2025":
            statusCode = http_status_1.default.NOT_FOUND;
            message = "Record not found";
            errorMessages.push({ path: "", message: error.message });
            break;
        case "P2003":
            statusCode = http_status_1.default.BAD_REQUEST;
            message = "Foreign key constraint failed";
            errorMessages.push({ path: "", message: error.message });
            break;
        default:
            errorMessages.push({ path: "", message: error.message });
    }
    return { statusCode, message, errorMessages };
};
exports.default = handlePrismaError;
//# sourceMappingURL=handlePrismaError.js.map