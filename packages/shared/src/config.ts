import { z } from "zod";

/** Client-safe runtime config (no secrets). */
export const PublicAppConfigSchema = z.object({
  productName: z.literal("GoodHuman"),
  domain: z.literal("GoodHuman.IO"),
  bookingFeeFree: z.number(),
  bookingFeePremium: z.number(),
  premiumPriceMonthlyCents: z.number().int(),
  depositDefault: z.number(),
  depositChoices: z.tuple([z.literal(0.25), z.literal(0.5), z.literal(1)]),
  payoutDelayHours: z.number().int(),
  maxImageBytes: z.number().int(),
  maxVideoBytes: z.number().int(),
  maxAudioBytes: z.number().int(),
  signedUrlTtlSeconds: z.number().int(),
  videoWatermarkLimitation:
    z.literal(
      "Videos are not re-encoded with a burned-in watermark in version one. Poster images are watermarked; preview playback uses a visible overlay.",
    ),
  notALawFirm:
    z.literal(
      "GoodHuman is not a law firm. Document tools are informational and do not constitute legal advice.",
    ),
});
export type PublicAppConfig = z.infer<typeof PublicAppConfigSchema>;
