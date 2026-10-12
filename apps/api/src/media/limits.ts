import { serverConfig } from "../config.js";

const IMAGE = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO = new Set(["video/mp4"]);
const AUDIO = new Set(["audio/mpeg"]);

export function kindForMime(mime: string): "IMAGE" | "VIDEO" | "AUDIO" | null {
  if (IMAGE.has(mime)) return "IMAGE";
  if (VIDEO.has(mime)) return "VIDEO";
  if (AUDIO.has(mime)) return "AUDIO";
  return null;
}

export function maxBytesForKind(kind: "IMAGE" | "VIDEO" | "AUDIO"): number {
  if (kind === "IMAGE") return serverConfig.maxImageBytes;
  if (kind === "VIDEO") return serverConfig.maxVideoBytes;
  return serverConfig.maxAudioBytes;
}
