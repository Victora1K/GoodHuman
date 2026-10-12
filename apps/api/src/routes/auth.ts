import { Hono } from "hono";
import { SignupSchema, LoginSchema, AuthResponseSchema } from "@goodhuman/shared";
import { prisma } from "../db.js";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { signToken } from "../auth/jwt.js";
import { requireAuth, type AppVariables } from "../auth/middleware.js";
import { rateLimit } from "../rate-limit.js";

export const authRoutes = new Hono<{ Variables: AppVariables }>();

authRoutes.post("/signup", rateLimit({ key: "signup", limit: 20, windowMs: 60_000 }), async (c) => {
  const body = SignupSchema.parse(await c.req.json());

  if (body.role === "BOOKER" && body.bookerSubtype === "VENUE" && !body.venueAddress) {
    return c.json({ error: "Venue bookers need an address." }, 400);
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
  if (existing) {
    return c.json({ error: "Email already registered." }, 409);
  }

  const user = await prisma.user.create({
    data: {
      email: body.email.toLowerCase(),
      passwordHash: await hashPassword(body.password),
      role: body.role,
      displayName: body.displayName,
      ageConfirmedAt: new Date(),
      bookerSubtype: body.role === "BOOKER" ? (body.bookerSubtype ?? "INDIVIDUAL") : null,
      venueAddress: body.role === "BOOKER" ? (body.venueAddress ?? null) : null,
    },
  });

  await prisma.analyticsEvent.create({
    data: { name: "sign-up", userId: user.id, metaJson: { role: user.role } },
  });

  const token = await signToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });

  const response = AuthResponseSchema.parse({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      premium: user.premium,
      bookerSubtype: user.bookerSubtype,
    },
  });

  return c.json(response, 201);
});

authRoutes.post("/login", rateLimit({ key: "login", limit: 30, windowMs: 60_000 }), async (c) => {
  const body = LoginSchema.parse(await c.req.json());
  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
  });
  if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
    return c.json({ error: "Invalid email or password." }, 401);
  }

  const token = await signToken({
    sub: user.id,
    role: user.role,
    email: user.email,
  });

  return c.json(
    AuthResponseSchema.parse({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        premium: user.premium,
        bookerSubtype: user.bookerSubtype,
      },
    }),
  );
});

authRoutes.get("/me", requireAuth, async (c) => {
  const user = c.get("user");
  return c.json({
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName,
    premium: user.premium,
    bookerSubtype: user.bookerSubtype,
  });
});
