"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const notFoundHandler = (_req, res) => {
    res.status(http_status_1.default.NOT_FOUND).json({
        success: false,
        message: "API Not Found!",
        errorMessages: [
            {
                path: _req.originalUrl,
                message: "API Not Found!",
            },
        ],
    });
};
exports.default = notFoundHandler;
//# sourceMappingURL=notFoundHandler.js.map