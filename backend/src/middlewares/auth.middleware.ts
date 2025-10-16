import jwt, { Secret, SignOptions } from "jsonwebtoken";

const JWT_SECRET: Secret = process.env.JWT_SECRET || "dev-secret"; // or validate and throw if missing

type JwtPayload = { id: string };

export function generateToken(userId: string): string {
  const payload: JwtPayload = { id: userId };
  const options: SignOptions = { expiresIn: "1d" }; // string or number are OK
  return jwt.sign(payload, JWT_SECRET, options);
}

export const verifyJWT = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}