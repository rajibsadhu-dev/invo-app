import jwt, { JwtPayload } from "jsonwebtoken";

const createToken = (
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: string
): string => {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

const verifyToken = (token: string, secret: string): JwtPayload => {
  return jwt.verify(token, secret) as JwtPayload;
};

export const jwtHelpers = { createToken, verifyToken };
