import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request } from "express";

const message = {
  success: false,
  message: "Too many attempts. Please try again later.",
  errorMessages: [{ path: "", message: "Too many attempts. Please try again later." }],
};

/**
 * Credential endpoints. Keyed on IP + submitted email so one noisy IP behind NAT
 * cannot lock out every account, and one account cannot be sprayed from one host.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message,
  keyGenerator: (req: Request) => {
    const email =
      typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "";
    // ipKeyGenerator normalises IPv6 into a /64 subnet key.
    return `${ipKeyGenerator(req.ip ?? "")}:${email}`;
  },
});

/** Broad ceiling for everything else — a backstop, not a security control. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message,
});
