import prisma from "@/lib/prisma";
import app from "@/app";
import config from "@/config";
import seedSuperAdmin from "@/app/seedSuperAdmin";
import { AuthService } from "@/app/modules/auth/auth.service";

const REFRESH_TOKEN_SWEEP_INTERVAL = 24 * 60 * 60 * 1000;

const sweepExpiredRefreshTokens = async (): Promise<void> => {
  try {
    const removed = await AuthService.purgeExpiredRefreshTokens();
    if (removed > 0) {
      console.log(`🧹 Purged ${removed} expired refresh token(s)`);
    }
  } catch (error) {
    console.error("⚠️  Refresh token sweep failed:", error);
  }
};

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log("🗄️  Database connected successfully");

    // Seed superadmin on first boot
    await seedSuperAdmin();

    await sweepExpiredRefreshTokens();
    const sweepTimer = setInterval(
      sweepExpiredRefreshTokens,
      REFRESH_TOKEN_SWEEP_INTERVAL
    );
    // Do not hold the process open for the sweep alone.
    sweepTimer.unref();

    app.listen(config.port, () => {
      console.log(`🚀 Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
