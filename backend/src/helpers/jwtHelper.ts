import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const createToken = (
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: string
): string => {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as SignOptions["expiresIn"],
  });
};

const verifyToken = (token: string, secret: string): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

/** Absolute expiry of an already-signed token, as a Date. */
const expiryOf = (token: string): Date => {
  const decoded = jwt.decode(token) as JwtPayload | null;
  if (!decoded?.exp) {
    throw new Error("Token has no exp claim");
  }
  return new Date(decoded.exp * 1000);
};

export const jwtHelpers = { createToken, verifyToken, expiryOf };
