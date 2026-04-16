"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("@/lib/prisma"));
const config_1 = __importDefault(require("@/config"));
const seedSuperAdmin = async () => {
    try {
        const { super_admin } = config_1.default;
        if (!super_admin.email || !super_admin.password) {
            console.log("⚠️  Superadmin credentials not found in .env — skipping seed");
            return;
        }
        // Check if superadmin already exists
        const existingSuperAdmin = await prisma_1.default.user.findFirst({
            where: { role: "superadmin" },
        });
        if (existingSuperAdmin) {
            return; // Superadmin already exists, skip silently
        }
        const hashedPassword = await bcrypt_1.default.hash(super_admin.password, config_1.default.bcrypt_salt_rounds);
        // Create superadmin
        await prisma_1.default.user.create({
            data: {
                name: "Super Admin",
                email: super_admin.email,
                password: hashedPassword,
                role: "superadmin",
            },
        });
        console.log("✅ Superadmin account seeded successfully");
    }
    catch (error) {
        console.error("❌ Failed to seed superadmin:", error);
    }
};
exports.default = seedSuperAdmin;
//# sourceMappingURL=seedSuperAdmin.js.map