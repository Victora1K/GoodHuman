import { z } from "zod";
import { TravelScopeSchema } from "./travel.js";
import { PublicMediaSchema } from "./media.js";

export const ArtistCategorySchema = z.enum([
  "DJ",
  "BAND",
  "SOLO_MUSICIAN",
  "COMEDIAN",
  "DANCER",
  "SPEAKER",
  "OTHER",
]);
export type ArtistCategory = z.infer<typeof ArtistCategorySchema>;

export const UpsertArtistProfileSchema = z.object({
  actName: z.string().min(1).max(120),
  bio: z.string().max(4000).optional(),
  category: ArtistCategorySchema,
  city: z.string().min(1).max(120),
  country: z.string().length(2).default("US"),
  region: z.string().max(120).optional(),
  travelScope: TravelScopeSchema,
  openToTravel: z.boolean(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.enum([
          "INSTAGRAM",
          "YOUTUBE",
          "SPOTIFY",
          "TIKTOK",
          "WEBSITE",
          "OTHER",
        ]),
        url: z.string().url(),
      }),
    )
    .max(10)
    .optional(),
});
export type UpsertArtistProfileInput = z.infer<typeof UpsertArtistProfileSchema>;

export const PublishArtistProfileSchema = z.object({
  confirm: z.literal(true),
});

export const AvailabilityDateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1),
  open: z.boolean().default(true),
  note: z.string().max(500).optional(),
});
export type AvailabilityDateInput = z.infer<typeof AvailabilityDateSchema>;

export const SetAvailabilitySchema = z.object({
  dates: z.array(AvailabilityDateSchema).min(1).max(366),
});

export const ArtistSearchQuerySchema = z.object({
  city: z.string().min(1).max(120).optional(),
  category: ArtistCategorySchema.optional(),
  travelScope: TravelScopeSchema.optional(),
  country: z.string().length(2).optional(),
  q: z.string().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ArtistSearchQuery = z.infer<typeof ArtistSearchQuerySchema>;

/** Public artist profile — never includes email, phone, home address, or original media keys. */
export const PublicArtistProfileSchema = z.object({
  id: z.string().uuid(),
  actName: z.string(),
  bio: z.string().nullable(),
  category: ArtistCategorySchema,
  city: z.string(),
  country: z.string(),
  region: z.string().nullable(),
  travelScope: TravelScopeSchema,
  openToTravel: z.boolean(),
  published: z.boolean(),
  spotlight: z.boolean(),
  media: z.array(PublicMediaSchema),
  availability: z.array(
    z.object({
      date: z.string(),
      timezone: z.string(),
      open: z.boolean(),
    }),
  ),
  socialLinks: z.array(
    z.object({
      platform: z.string(),
      url: z.string().url(),
      displayName: z.string().nullable(),
      avatarUrl: z.string().url().nullable(),
    }),
  ),
});
export type PublicArtistProfile = z.infer<typeof PublicArtistProfileSchema>;
