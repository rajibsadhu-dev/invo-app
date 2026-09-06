import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import config from "@/config";
import globalErrorHandler from "@/app/middlewares/globalErrorHandler";
import notFoundHandler from "@/app/middlewares/notFoundHandler";
import { apiLimiter } from "@/app/middlewares/rateLimiter";
import router from "./app/routes";

const app: Application = express();

const PUBLIC_DIR = path.join(process.cwd(), "public");
const SPA_INDEX = path.join(PUBLIC_DIR, "index.html");

// Behind a reverse proxy, req.ip must come from X-Forwarded-For or every client
// shares the proxy's address and rate limiting collapses into one bucket.
app.set("trust proxy", 1);

// ─── Security & transport ─────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // The SPA build inlines a small bootstrap style; images include uploaded logos.
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'", "data:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
      },
    },
    // Logos are loaded by the same origin that serves the app.
    crossOriginResourcePolicy: { policy: "same-origin" },
  })
);
app.use(compression());

// ─── CORS ─────────────────────────────────────────────
// Single-origin deploy needs no cross-origin access at all; the allowlist exists for
// the Vite dev server and for a future split-domain deploy. Never reflect an
// arbitrary origin while credentials are enabled.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // same-origin, curl, server-to-server
      if (config.cors_origins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);

// ─── Parsers ──────────────────────────────────────────
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ─── Static Files ─────────────────────────────────────
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"), {
    maxAge: "7d",
    index: false,
    dotfiles: "deny",
  })
);

// ─── API Routes ───────────────────────────────────────
app.use("/api/v1", apiLimiter, router);

// ─── SPA (single-origin deploy) ───────────────────────
// Serves the built frontend from backend/public when present. Mounted after the API so
// /api/v1/* always resolves to JSON, and guarded so unknown API paths still 404 as JSON.
if (fs.existsSync(SPA_INDEX)) {
  app.use(express.static(PUBLIC_DIR, { index: false, maxAge: "1h" }));

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(SPA_INDEX);
  });
}

// ─── Error Handlers ───────────────────────────────────
// notFound first: it is a normal handler, so anything reaching it has matched no route.
// globalErrorHandler last: an error handler must sit after everything it protects.
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
