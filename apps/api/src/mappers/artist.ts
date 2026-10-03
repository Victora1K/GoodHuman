import type {
  ArtistProfile,
  AvailabilityDate,
  MediaAsset,
  SocialLink,
} from "@prisma/client";
import type { PublicArtistProfile, PublicMedia } from "@goodhuman/shared";
import { getStorage } from "../storage/index.js";
import { publicAppConfig } from "../config.js";

type ArtistWithRelations = ArtistProfile & {
  media: MediaAsset[];
  availability: AvailabilityDate[];
  socialLinks: SocialLink[];
};

export function toPublicMedia(asset: MediaAsset): PublicMedia {
  const storage = getStorage();
  const previewKey = asset.previewKey ?? asset.posterKey;
  const previewUrl =
    asset.isPublicPreview && previewKey && asset.status === "READY"
      ? storage.publicUrl(previewKey)
      : null;

  return {
    id: asset.id,
    kind: asset.kind,
    mimeType: asset.mimeType as PublicMedia["mimeType"],
    status: asset.status,
    previewUrl,
    hasOriginal: Boolean(asset.originalKey),
    watermarkedPreview: asset.watermarkedPreview,
    videoPreviewOverlayNote:
      asset.kind === "VIDEO"
        ? publicAppConfig().videoWatermarkLimitation
        : null,
  };
}

export function toPublicArtistProfile(artist: ArtistWithRelations): PublicArtistProfile {
  return {
    id: artist.id,
    actName: artist.actName,
    bio: artist.bio,
    category: artist.category,
    city: artist.city,
    country: artist.country,
    region: artist.region,
    travelScope: artist.travelScope,
    openToTravel: artist.openToTravel,
    published: artist.published,
    spotlight: artist.spotlight,
    media: artist.media
      .filter((m) => m.status !== "HIDDEN")
      .map(toPublicMedia),
    availability: artist.availability.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      timezone: d.timezone,
      open: d.open,
    })),
    socialLinks: artist.socialLinks.map((s) => ({
      platform: s.platform,
      url: s.url,
      displayName: s.displayName,
      avatarUrl: s.avatarUrl,
    })),
  };
}

/** Ensure private fields never leak even if someone spreads a Prisma row. */
export function assertNoContactLeak(payload: unknown): void {
  const json = JSON.stringify(payload);
  const forbidden = ["passwordHash", "email", "venueAddress", "originalKey"];
  for (const key of forbidden) {
    // Allow the word only as a false-positive in prose, not as a JSON key.
    if (json.includes(`"${key}"`)) {
      throw new Error(`Contact privacy leak: ${key}`);
    }
  }
}
