"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), ".env") });
exports.default = {
    env: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT) || 9000,
    database_url: process.env.DATABASE_URL || "",
    jwt: {
        secret: process.env.JWT_SECRET || "fallback-secret",
        expires_in: process.env.JWT_EXPIRES_IN || "1d",
        refresh_secret: process.env.JWT_REFRESH_SECRET || "fallback-refresh-secret",
        refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    },
    bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
    super_admin: {
        email: process.env.SUPERADMIN_EMAIL || "",
        password: process.env.SUPERADMIN_PASSWORD || "",
    },
};
//# sourceMappingURL=index.js.map