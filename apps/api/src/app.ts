import { Hono } from "hono";
import { cors } from "hono/cors";
import { ZodError } from "zod";
import { serverConfig, publicAppConfig } from "./config.js";
import { authRoutes } from "./routes/auth.js";
import { artistRoutes } from "./routes/artists.js";
import { mediaRoutes } from "./routes/media.js";
import { inquiryRoutes } from "./routes/inquiries.js";
import { publicFileRoutes } from "./routes/public-files.js";
import { openApiDocument } from "./openapi.js";

export function createApp() {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: [serverConfig.appUrl, "http://localhost:3000", "http://127.0.0.1:3000"],
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );

  app.get("/health", (c) => c.json({ ok: true, product: "GoodHuman" }));
  app.get("/config", (c) => c.json(publicAppConfig()));
  app.get("/openapi.json", (c) => c.json(openApiDocument));

  app.route("/auth", authRoutes);
  app.route("/artists", artistRoutes);
  app.route("/media", mediaRoutes);
  app.route("/inquiries", inquiryRoutes);
  app.route("/public", publicFileRoutes);

  app.onError((err, c) => {
    if (err instanceof ZodError) {
      return c.json({ error: "Validation failed", details: err.flatten() }, 400);
    }
    console.error(err);
    return c.json({ error: "Internal server error" }, 500);
  });

  return app;
}
