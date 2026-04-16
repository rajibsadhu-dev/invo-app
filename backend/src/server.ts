import prisma from "@/lib/prisma";
import app from "@/app";
import config from "@/config";
import seedSuperAdmin from "@/app/seedSuperAdmin";

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log("🗄️  Database connected successfully");

    // Seed superadmin on first boot
    await seedSuperAdmin();

    app.listen(config.port, () => {
      console.log(`🚀 Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
