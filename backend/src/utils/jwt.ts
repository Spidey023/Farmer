import jwt, { Secret, SignOptions } from "jsonwebtoken";

// const JWT_SECRET: Secret = process.env.ACCESS_JWT_SECRET || "dev-secreate";

type JwtPayload = { id: string };

export function generateAccessToken(userId: string): string {
  const payload: JwtPayload = { id: userId };
  const options: SignOptions = { expiresIn: "1d" };
  return jwt.sign(
    payload,
    process.env.ACCESS_JWT_SECRET || "dev-secreate",
    options
  );
}

export function generateRefreshToken(userId: string): string {
  const payload: JwtPayload = { id: userId };
  const options: SignOptions = { expiresIn: "7d" };
  return jwt.sign(
    payload,
    process.env.REFRESH_JWT_SECRET || "dev-refresh-secreate",
    options
  );
}

// Verify refresh token using refresh secret
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(
    token,
    process.env.REFRESH_JWT_SECRET || "dev-refresh-secreate"
  ) as JwtPayload;
}

// Verify JWT Token
export function verifyJWTToken(token: string): JwtPayload {
  return jwt.verify(
    token,
    process.env.ACCESS_JWT_SECRET || "dev-secrete"
  ) as JwtPayload;
}
