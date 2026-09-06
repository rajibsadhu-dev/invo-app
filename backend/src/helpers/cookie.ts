import { CookieOptions } from "express";
import config from "@/config";

export const REFRESH_COOKIE = "refreshToken";

/**
 * Single source of truth for refresh-cookie flags. `sameSite: "strict"` is correct for the
 * single-origin deploy; flipping COOKIE_CROSS_SITE switches to the (HTTPS-only) settings a
 * split app/API domain requires, so that move is a config change rather than a code change.
 */
export const refreshCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: config.isProduction || config.cookie_cross_site,
  sameSite: config.cookie_cross_site ? "none" : "strict",
  path: "/api/v1/auth",
  maxAge: config.jwt.refresh_expires_ms,
});

/** clearCookie must match the flags the cookie was set with, minus maxAge. */
export const clearRefreshCookieOptions = (): CookieOptions => {
  const { maxAge: _maxAge, ...rest } = refreshCookieOptions();
  return rest;
};
