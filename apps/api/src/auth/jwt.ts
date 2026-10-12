import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@goodhuman/shared";
import { serverConfig } from "../config.js";

export type JwtPayload = {
  sub: string;
  role: UserRole;
  email: string;
};

const secret = () => new TextEncoder().encode(serverConfig.jwtSecret);

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret());
  if (!payload.sub || typeof payload.role !== "string" || typeof payload.email !== "string") {
    throw new Error("Invalid token payload");
  }
  return {
    sub: payload.sub,
    role: payload.role as UserRole,
    email: payload.email,
  };
}
