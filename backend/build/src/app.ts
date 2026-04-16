import express, { Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import globalErrorHandler from "@/app/middlewares/globalErrorHandler";
import notFoundHandler from "@/app/middlewares/notFoundHandler";
import router from "./app/routes";

const app: Application = express();

// ─── Parsers ──────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static Files ─────────────────────────────
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ─── API Routes ───────────────────────────────
app.use("/api/v1", router);

// ─── Error Handlers ───────────────────────────
app.use(globalErrorHandler);
app.use(notFoundHandler);

export default app;
