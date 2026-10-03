import { PublicAppConfigSchema, type PublicAppConfig } from "@goodhuman/shared";

function num(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  if (Number.isNaN(n)) throw new Error(`Invalid number for ${name}`);
  return n;
}

export const serverConfig = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: num("PORT", 4000),
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://goodhuman:goodhuman@localhost:5432/goodhuman",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  jwtSecret: process.env.JWT_SECRET ?? "dev-change-me-goodhuman-jwt-secret",
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  apiUrl: process.env.API_URL ?? "http://localhost:4000",
  cdnPublicUrl: process.env.CDN_PUBLIC_URL ?? "http://localhost:4000/public",
  storageDriver: (process.env.STORAGE_DRIVER ?? "local") as "local" | "s3",
  storageLocalRoot: process.env.STORAGE_LOCAL_ROOT ?? "./storage",
  s3: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    bucket: process.env.S3_BUCKET ?? "goodhuman",
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  },
  bookingFeeFree: num("BOOKING_FEE_FREE", 0.08),
  bookingFeePremium: num("BOOKING_FEE_PREMIUM", 0.04),
  premiumPriceMonthlyCents: num("PREMIUM_PRICE_MONTHLY_CENTS", 2900),
  depositDefault: num("DEPOSIT_DEFAULT", 0.5),
  payoutDelayHours: num("PAYOUT_DELAY_HOURS", 24),
  maxImageBytes: num("MAX_IMAGE_BYTES", 20 * 1024 * 1024),
  maxVideoBytes: num("MAX_VIDEO_BYTES", 200 * 1024 * 1024),
  maxAudioBytes: num("MAX_AUDIO_BYTES", 30 * 1024 * 1024),
  signedUrlTtlSeconds: num("SIGNED_URL_TTL_SECONDS", 300),
};

export function publicAppConfig(): PublicAppConfig {
  return PublicAppConfigSchema.parse({
    productName: "GoodHuman",
    domain: "GoodHuman.IO",
    bookingFeeFree: serverConfig.bookingFeeFree,
    bookingFeePremium: serverConfig.bookingFeePremium,
    premiumPriceMonthlyCents: serverConfig.premiumPriceMonthlyCents,
    depositDefault: serverConfig.depositDefault,
    depositChoices: [0.25, 0.5, 1],
    payoutDelayHours: serverConfig.payoutDelayHours,
    maxImageBytes: serverConfig.maxImageBytes,
    maxVideoBytes: serverConfig.maxVideoBytes,
    maxAudioBytes: serverConfig.maxAudioBytes,
    signedUrlTtlSeconds: serverConfig.signedUrlTtlSeconds,
    videoWatermarkLimitation:
      "Videos are not re-encoded with a burned-in watermark in version one. Poster images are watermarked; preview playback uses a visible overlay.",
    notALawFirm:
      "GoodHuman is not a law firm. Document tools are informational and do not constitute legal advice.",
  });
}
