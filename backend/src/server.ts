import prisma from "@/lib/prisma";
import app from "@/app";
import config from "@/config";
import seedSuperAdmin from "@/app/seedSuperAdmin";
import { AuthService } from "@/app/modules/auth/auth.service";

const REFRESH_TOKEN_SWEEP_INTERVAL = 24 * 60 * 60 * 1000;

const backfillOrgOwners = async (): Promise<void> => {
  const orgs = await prisma.organization.findMany({
    select: { id: true, ownerId: true },
  });

  let created = 0;
  for (const org of orgs) {
    const existing = await prisma.orgMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: org.ownerId,
        },
      },
    });
    if (!existing) {
      await prisma.orgMember.create({
        data: {
          organizationId: org.id,
          userId: org.ownerId,
          role: "owner",
        },
      });
      created++;
    }
  }
  if (created > 0) {
    console.log(`📋 Backfilled ${created} org owner(s) into OrgMember`);
  }
};

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

    // Backfill: ensure every org owner has an OrgMember row
    await backfillOrgOwners();

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
