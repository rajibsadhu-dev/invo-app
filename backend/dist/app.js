"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const globalErrorHandler_1 = __importDefault(require("@/app/middlewares/globalErrorHandler"));
const notFoundHandler_1 = __importDefault(require("@/app/middlewares/notFoundHandler"));
const routes_1 = __importDefault(require("./app/routes"));
const app = (0, express_1.default)();
// ─── Parsers ──────────────────────────────────
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ─── Static Files ─────────────────────────────
app.use("/uploads", express_1.default.static(path_1.default.join(process.cwd(), "uploads")));
// ─── API Routes ───────────────────────────────
app.use("/api/v1", routes_1.default);
// ─── Error Handlers ───────────────────────────
app.use(globalErrorHandler_1.default);
app.use(notFoundHandler_1.default);
exports.default = app;
//# sourceMappingURL=app.js.map