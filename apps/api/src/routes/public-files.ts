import { Hono } from "hono";
import { getStorage } from "../storage/index.js";

/**
 * Public CDN-style path for watermarked previews only.
 * Originals live under originals/ and are never registered with a .public marker.
 */
export const publicFileRoutes = new Hono();

publicFileRoutes.get("/*", async (c) => {
  const key = c.req.path.replace(/^\/public\//, "");
  if (!key || key.includes("..") || key.startsWith("originals/")) {
    return c.json({ error: "Not found" }, 404);
  }

  const storage = getStorage();
  if (!(await storage.isPublicMarker(key))) {
    return c.json({ error: "Not found" }, 404);
  }

  try {
    const body = await storage.getObject(key);
    const contentType = key.endsWith(".png")
      ? "image/png"
      : key.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";
    return new Response(body, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=3600",
      },
    });
  } catch {
    return c.json({ error: "Not found" }, 404);
  }
});
