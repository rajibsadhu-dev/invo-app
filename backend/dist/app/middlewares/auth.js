"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const jwtHelper_1 = require("@/helpers/jwtHelper");
const config_1 = __importDefault(require("@/config"));
const ApiError_1 = __importDefault(require("@/app/errors/ApiError"));
const auth = (...requiredRoles) => async (req, _res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized");
        }
        const token = authHeader.split(" ")[1];
        // Verify token
        const decoded = jwtHelper_1.jwtHelpers.verifyToken(token, config_1.default.jwt.secret);
        // Attach user to request
        req.user = decoded;
        // Check role authorization
        if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
            throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "You do not have permission to access this resource");
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.default = auth;
//# sourceMappingURL=auth.js.map