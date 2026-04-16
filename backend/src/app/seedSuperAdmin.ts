import bcrypt from "bcrypt";
import prisma from "@/lib/prisma";
import config from "@/config";

const seedSuperAdmin = async (): Promise<void> => {
  try {
    const { super_admin } = config;

    if (!super_admin.email || !super_admin.password) {
      console.log(
        "⚠️  Superadmin credentials not found in .env — skipping seed"
      );
      return;
    }

    // Check if superadmin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: "superadmin" },
    });
    if (existingSuperAdmin) {
      return; // Superadmin already exists, skip silently
    }

    const hashedPassword = await bcrypt.hash(
      super_admin.password,
      config.bcrypt_salt_rounds
    );

    // Create superadmin
    await prisma.user.create({
      data: {
        name: "Super Admin",
        email: super_admin.email,
        password: hashedPassword,
        role: "superadmin",
      },
    });

    console.log("✅ Superadmin account seeded successfully");
  } catch (error) {
    console.error("❌ Failed to seed superadmin:", error);
  }
};

export default seedSuperAdmin;
