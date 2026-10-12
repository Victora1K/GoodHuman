import type { Context, Next } from "hono";
import { verifyToken, type JwtPayload } from "./jwt.js";
import { prisma } from "../db.js";
import type { User } from "@prisma/client";

export type AppVariables = {
  jwt: JwtPayload;
  user: User;
};

export async function requireAuth(c: Context<{ Variables: AppVariables }>, next: Next) {
  const header = c.req.header("authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = header.slice("Bearer ".length);
  try {
    const jwt = await verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: jwt.sub } });
    if (!user) return c.json({ error: "Unauthorized" }, 401);
    c.set("jwt", jwt);
    c.set("user", user);
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
}

export function requireRole(...roles: Array<"ARTIST" | "BOOKER" | "ADMIN">) {
  return async (c: Context<{ Variables: AppVariables }>, next: Next) => {
    const user = c.get("user");
    if (!roles.includes(user.role)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    await next();
  };
}

export async function optionalAuth(c: Context<{ Variables: AppVariables }>, next: Next) {
  const header = c.req.header("authorization");
  if (header?.startsWith("Bearer ")) {
    try {
      const jwt = await verifyToken(header.slice("Bearer ".length));
      const user = await prisma.user.findUnique({ where: { id: jwt.sub } });
      if (user) {
        c.set("jwt", jwt);
        c.set("user", user);
      }
    } catch {
      // ignore
    }
  }
  await next();
}
