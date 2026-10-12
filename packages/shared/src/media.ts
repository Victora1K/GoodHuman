import { z } from "zod";

export const MediaKindSchema = z.enum(["IMAGE", "VIDEO", "AUDIO"]);
export type MediaKind = z.infer<typeof MediaKindSchema>;

export const MediaStatusSchema = z.enum([
  "UPLOADING",
  "PROCESSING",
  "READY",
  "FAILED",
  "HIDDEN",
]);
export type MediaStatus = z.infer<typeof MediaStatusSchema>;

export const AllowedImageMimeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
export const AllowedVideoMimeSchema = z.enum(["video/mp4"]);
export const AllowedAudioMimeSchema = z.enum(["audio/mpeg"]);

export const AllowedMimeSchema = z.union([
  AllowedImageMimeSchema,
  AllowedVideoMimeSchema,
  AllowedAudioMimeSchema,
]);
export type AllowedMime = z.infer<typeof AllowedMimeSchema>;

export const PublicMediaSchema = z.object({
  id: z.string().uuid(),
  kind: MediaKindSchema,
  mimeType: AllowedMimeSchema,
  status: MediaStatusSchema,
  previewUrl: z.string().url().nullable(),
  /** Original file keys and URLs are never exposed on public surfaces. */
  hasOriginal: z.boolean(),
  watermarkedPreview: z.boolean(),
  videoPreviewOverlayNote: z
    .string()
    .nullable()
    .describe(
      "Version one does not burn watermarks into video playback; poster is watermarked and preview uses an overlay.",
    ),
});
export type PublicMedia = z.infer<typeof PublicMediaSchema>;
