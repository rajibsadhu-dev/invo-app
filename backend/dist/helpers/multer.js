"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadLogo = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const ApiError_1 = __importDefault(require("@/app/errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
// Ensure uploads directory exists
const LOGO_DIR = path_1.default.join(process.cwd(), "uploads", "logos");
if (!fs_1.default.existsSync(LOGO_DIR)) {
    fs_1.default.mkdirSync(LOGO_DIR, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, LOGO_DIR),
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path_1.default.extname(file.originalname).toLowerCase()}`);
    },
});
const fileFilter = (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Only JPEG, PNG, and WebP images are allowed"));
    }
};
exports.uploadLogo = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("logo");
//# sourceMappingURL=multer.js.map