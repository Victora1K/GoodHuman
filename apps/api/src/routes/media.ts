import { Hono } from "hono";
import { prisma } from "../db.js";
import {
  requireAuth,
  type AppVariables,
} from "../auth/middleware.js";
import { getStorage } from "../storage/index.js";
import { kindForMime, maxBytesForKind } from "../media/limits.js";
import { enqueueWatermark } from "../jobs/queue.js";
import { toPublicMedia } from "../mappers/artist.js";
import { serverConfig } from "../config.js";
import { processWatermarkJob } from "../jobs/watermark-processor.js";

export const mediaRoutes = new Hono<{ Variables: AppVariables }>();

mediaRoutes.post("/upload", requireAuth, async (c) => {
  const user = c.get("user");
  const form = await c.req.parseBody();
  const file = form["file"];
  if (!file || typeof file === "string") {
    return c.json({ error: "file is required" }, 400);
  }

  const mime = file.type || "application/octet-stream";
  const kind = kindForMime(mime);
  if (!kind) {
    return c.json(
      { error: "Unsupported type. Use JPEG, PNG, WEBP, MP4, or MP3." },
      400,
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.byteLength > maxBytesForKind(kind)) {
    return c.json({ error: "File exceeds size limit for its type." }, 400);
  }

  let artistProfileId: string | undefined;
  if (user.role === "ARTIST") {
    const profile = await prisma.artistProfile.findUnique({
      where: { userId: user.id },
    });
    artistProfileId = profile?.id;
  }

  const media = await prisma.mediaAsset.create({
    data: {
      ownerId: user.id,
      artistProfileId: artistProfileId ?? null,
      kind,
      mimeType: mime,
      byteSize: buf.byteLength,
      originalKey: "pending",
      status: "UPLOADING",
    },
  });

  const ext =
    mime === "image/png"
      ? "png"
      : mime === "image/webp"
        ? "webp"
        : mime === "video/mp4"
          ? "mp4"
          : mime === "audio/mpeg"
            ? "mp3"
            : "jpg";

  const originalKey = `originals/${media.id}.${ext}`;
  const storage = getStorage();
  await storage.putObject({
    key: originalKey,
    body: buf,
    contentType: mime,
    isPublic: false,
  });

  await prisma.mediaAsset.update({
    where: { id: media.id },
    data: { originalKey, status: "PROCESSING" },
  });

  // Background job in normal operation; inline when GH_INLINE_WATERMARK=1 or queue is unavailable.
  if (process.env.GH_INLINE_WATERMARK === "1") {
    await processWatermarkJob({ data: { mediaId: media.id } } as never);
  } else {
    try {
      await enqueueWatermark(media.id);
    } catch {
      await processWatermarkJob({ data: { mediaId: media.id } } as never);
    }
  }

  // Give a brief moment for inline/fast jobs in tests.
  const refreshed = await waitForReady(media.id, 2_000);
  return c.json(toPublicMedia(refreshed), 201);
});

async function waitForReady(id: string, ms: number) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const row = await prisma.mediaAsset.findUniqueOrThrow({ where: { id } });
    if (row.status === "READY" || row.status === "FAILED") return row;
    await new Promise((r) => setTimeout(r, 50));
  }
  return prisma.mediaAsset.findUniqueOrThrow({ where: { id } });
}

mediaRoutes.get("/signed", async (c) => {
  const key = c.req.query("key");
  const exp = Number(c.req.query("exp"));
  const sig = c.req.query("sig");
  if (!key || !exp || !sig) return c.json({ error: "Invalid signature params" }, 400);

  const storage = getStorage();
  if (!storage.verifySignature(key, exp, sig)) {
    return c.json({ error: "Invalid or expired signature" }, 403);
  }

  const body = await storage.getObject(key);
  const contentType = key.endsWith(".png")
    ? "image/png"
    : key.endsWith(".webp")
      ? "image/webp"
      : key.endsWith(".mp4")
        ? "video/mp4"
        : key.endsWith(".mp3")
          ? "audio/mpeg"
          : "image/jpeg";

  return new Response(body, {
    headers: {
      "content-type": contentType,
      "cache-control": "private, max-age=60",
    },
  });
});

mediaRoutes.get("/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const media = await prisma.mediaAsset.findUnique({ where: { id: c.req.param("id") } });
  if (!media) return c.json({ error: "Not found" }, 404);

  const wantsOriginal = c.req.query("variant") === "original";
  const storage = getStorage();

  if (wantsOriginal) {
    if (media.ownerId !== user.id && user.role !== "ADMIN") {
      return c.json({ error: "Original media is private." }, 403);
    }
    const url = await storage.getSignedUrl(media.originalKey, {
      ttlSeconds: serverConfig.signedUrlTtlSeconds,
      public: false,
    });
    return c.json({
      id: media.id,
      variant: "original",
      url,
      expiresInSeconds: serverConfig.signedUrlTtlSeconds,
      public: false,
    });
  }

  const previewKey = media.previewKey ?? media.posterKey;
  if (!previewKey || !media.isPublicPreview) {
    return c.json({ error: "Preview not ready." }, 404);
  }
  const url = await storage.getSignedUrl(previewKey, {
    ttlSeconds: serverConfig.signedUrlTtlSeconds,
    public: true,
  });
  return c.json({
    id: media.id,
    variant: "preview",
    url,
    public: true,
    watermarked: media.watermarkedPreview,
  });
});
