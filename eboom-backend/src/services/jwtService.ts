import bcrypt from "bcryptjs";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "1h";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  throw new Error("Missing required JWT_SECRET environment variable");
}

const accessSignOptions: SignOptions = { expiresIn: JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"] };
const refreshSignOptions: SignOptions = { expiresIn: JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] };

export interface AccessTokenPayload {
  sub: number;
  email: string;
  type: "access";
}

export interface RefreshTokenPayload {
  sub: number;
  type: "refresh";
}

function parseExpiresInSeconds(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 3600;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 3600;
    case "d":
      return value * 86400;
    default:
      return 3600;
  }
}

export function getAccessExpiresInSeconds(): number {
  return parseExpiresInSeconds(JWT_ACCESS_EXPIRES_IN);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(userId: number, email: string): string {
  const payload: AccessTokenPayload = {
    sub: userId,
    email,
    type: "access",
  };
  return jwt.sign(payload, JWT_SECRET!, accessSignOptions);
}

export function signRefreshToken(userId: number): string {
  const payload: RefreshTokenPayload = {
    sub: userId,
    type: "refresh",
  };
  return jwt.sign(payload, JWT_SECRET!, refreshSignOptions);
}

function parseTokenPayload<T extends AccessTokenPayload | RefreshTokenPayload>(
  decoded: string | JwtPayload
): T {
  if (typeof decoded === "string") {
    throw new jwt.JsonWebTokenError("Invalid token payload");
  }
  return decoded as unknown as T;
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const payload = parseTokenPayload<AccessTokenPayload>(jwt.verify(token, JWT_SECRET!));
  if (payload.type !== "access") {
    throw new jwt.JsonWebTokenError("Invalid token type");
  }
  return payload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = parseTokenPayload<RefreshTokenPayload>(jwt.verify(token, JWT_SECRET!));
  if (payload.type !== "refresh") {
    throw new jwt.JsonWebTokenError("Invalid token type");
  }
  return payload;
}

export function signTokenPair(userId: number, email: string) {
  return {
    accessToken: signAccessToken(userId, email),
    refreshToken: signRefreshToken(userId),
    expiresIn: getAccessExpiresInSeconds(),
  };
}
