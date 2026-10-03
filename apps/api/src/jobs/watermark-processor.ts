import type { Job } from "bullmq";
import { prisma } from "../db.js";
import { getStorage } from "../storage/index.js";
import { makeVideoPosterPlaceholder, watermarkImage } from "../media/watermark.js";
import type { WatermarkJob } from "./queue.js";

export async function processWatermarkJob(job: Job<WatermarkJob>): Promise<void> {
  const media = await prisma.mediaAsset.findUnique({ where: { id: job.data.mediaId } });
  if (!media) return;

  await prisma.mediaAsset.update({
    where: { id: media.id },
    data: { status: "PROCESSING" },
  });

  const storage = getStorage();

  try {
    if (media.kind === "IMAGE") {
      const original = await storage.getObject(media.originalKey);
      const preview = await watermarkImage(original);
      const previewKey = `previews/${media.id}.jpg`;
      await storage.putObject({
        key: previewKey,
        body: preview,
        contentType: "image/jpeg",
        isPublic: true,
      });
      await prisma.mediaAsset.update({
        where: { id: media.id },
        data: {
          previewKey,
          status: "READY",
          watermarkedPreview: true,
          isPublicPreview: true,
        },
      });
      return;
    }

    if (media.kind === "VIDEO") {
      // Version one: watermark a poster only; no burned-in video re-encode.
      const poster = await makeVideoPosterPlaceholder();
      const posterKey = `posters/${media.id}.jpg`;
      await storage.putObject({
        key: posterKey,
        body: poster,
        contentType: "image/jpeg",
        isPublic: true,
      });
      await prisma.mediaAsset.update({
        where: { id: media.id },
        data: {
          posterKey,
          previewKey: posterKey,
          status: "READY",
          watermarkedPreview: true,
          isPublicPreview: true,
        },
      });
      return;
    }

    // Audio: no visual preview; mark ready without a public preview URL.
    await prisma.mediaAsset.update({
      where: { id: media.id },
      data: {
        status: "READY",
        watermarkedPreview: false,
        isPublicPreview: false,
      },
    });
  } catch (err) {
    await prisma.mediaAsset.update({
      where: { id: media.id },
      data: { status: "FAILED" },
    });
    throw err;
  }
}
