import jwt, { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret = process.env.ACCESS_TOKEN_SECRET || "dev-secret";

type JwtPayload = { id: string };

export function generateToken(userId: string): string {
  const payload: JwtPayload = { id: userId };
  const options: SignOptions = { expiresIn: "1d" };
  return jwt.sign(payload, JWT_SECRET, options);
}
