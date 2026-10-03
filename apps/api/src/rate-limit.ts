import type { Context, Next } from "hono";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(opts: { key: string; limit: number; windowMs: number }) {
  return async (c: Context, next: Next) => {
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const id = `${opts.key}:${ip}`;
    const now = Date.now();
    const bucket = buckets.get(id);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(id, { count: 1, resetAt: now + opts.windowMs });
      await next();
      return;
    }
    if (bucket.count >= opts.limit) {
      return c.json({ error: "Too many requests" }, 429);
    }
    bucket.count += 1;
    await next();
  };
}
