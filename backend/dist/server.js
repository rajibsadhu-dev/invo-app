"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("@/lib/prisma"));
const app_1 = __importDefault(require("@/app"));
const config_1 = __importDefault(require("@/config"));
const seedSuperAdmin_1 = __importDefault(require("@/app/seedSuperAdmin"));
async function bootstrap() {
    try {
        await prisma_1.default.$connect();
        console.log("🗄️  Database connected successfully");
        // Seed superadmin on first boot
        await (0, seedSuperAdmin_1.default)();
        app_1.default.listen(config_1.default.port, () => {
            console.log(`🚀 Server is running on port ${config_1.default.port}`);
        });
    }
    catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=server.js.map