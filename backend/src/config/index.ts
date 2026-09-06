import dotenv from "dotenv";
import path from "path";
import ms from "ms";
import { z } from "zod";

dotenv.config({ path: path.join(process.cwd(), ".env") });

/**
 * `ms` accepts a template-literal union in its typings, which is stricter than the
 * arbitrary strings that arrive from the environment. Narrow it here once.
 */
const toMilliseconds = (value: string): number | undefined => {
  const parsed = (ms as unknown as (v: string) => number | undefined)(value);
  return typeof parsed === "number" && Number.isFinite(parsed) && parsed > 0
    ? parsed
    : undefined;
};

const duration = (label: string) =>
  z
    .string()
    .refine((v) => toMilliseconds(v) !== undefined, {
      message: `${label} must be a duration like "15m", "1d" or "7d"`,
    });

const commaList = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );

const booleanish = z
  .string()
  .optional()
  .transform((v) => v === "true" || v === "1");

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(9025),

    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
    JWT_EXPIRES_IN: duration("JWT_EXPIRES_IN").default("15m"),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    JWT_REFRESH_EXPIRES_IN: duration("JWT_REFRESH_EXPIRES_IN").default("7d"),

    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

    SUPERADMIN_ID: z.coerce.number().int().positive().optional(),
    SUPERADMIN_EMAIL: z.string().email().optional().or(z.literal("")),
    SUPERADMIN_PASSWORD: z.string().optional(),

    CORS_ORIGINS: commaList,
    COOKIE_CROSS_SITE: booleanish,
    MAX_LOGO_SIZE_MB: z.coerce.number().positive().max(25).default(5),
  })
  .refine((env) => env.JWT_SECRET !== env.JWT_REFRESH_SECRET, {
    message: "JWT_SECRET and JWT_REFRESH_SECRET must be different values",
    path: ["JWT_REFRESH_SECRET"],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast and loudly: booting with a missing or weak secret is worse than not booting.
  console.error("❌ Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`   • ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  console.error("\n   See backend/.env.example for the expected shape.");
  process.exit(1);
}

const env = parsed.data;

/**
 * In a single-origin production deploy the SPA is served by Express, so no cross-origin
 * access is needed and an empty allowlist is correct. In development the SPA runs on the
 * Vite dev server instead, so fall back to it rather than silently blocking every request.
 */
const corsOrigins =
  env.CORS_ORIGINS.length > 0
    ? env.CORS_ORIGINS
    : env.NODE_ENV === "production"
      ? []
      : ["http://localhost:5173", "http://127.0.0.1:5173"];

export default {
  env: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  port: env.PORT,
  database_url: env.DATABASE_URL,
  jwt: {
    secret: env.JWT_SECRET,
    expires_in: env.JWT_EXPIRES_IN,
    refresh_secret: env.JWT_REFRESH_SECRET,
    refresh_expires_in: env.JWT_REFRESH_EXPIRES_IN,
    /** Refresh lifetime in ms — the single source of truth for cookie maxAge and the DB expiry. */
    refresh_expires_ms: toMilliseconds(env.JWT_REFRESH_EXPIRES_IN)!,
  },
  bcrypt_salt_rounds: env.BCRYPT_SALT_ROUNDS,
  super_admin: {
    id: env.SUPERADMIN_ID,
    email: env.SUPERADMIN_EMAIL || "",
    password: env.SUPERADMIN_PASSWORD || "",
  },
  cors_origins: corsOrigins,
  cookie_cross_site: env.COOKIE_CROSS_SITE,
  max_logo_size_bytes: env.MAX_LOGO_SIZE_MB * 1024 * 1024,
};
