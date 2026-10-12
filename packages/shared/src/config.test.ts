import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PublicAppConfigSchema } from "./config.js";

describe("PublicAppConfigSchema", () => {
  it("accepts the product defaults", () => {
    const parsed = PublicAppConfigSchema.parse({
      productName: "GoodHuman",
      domain: "GoodHuman.IO",
      bookingFeeFree: 0.08,
      bookingFeePremium: 0.04,
      premiumPriceMonthlyCents: 2900,
      depositDefault: 0.5,
      depositChoices: [0.25, 0.5, 1],
      payoutDelayHours: 24,
      maxImageBytes: 20 * 1024 * 1024,
      maxVideoBytes: 200 * 1024 * 1024,
      maxAudioBytes: 30 * 1024 * 1024,
      signedUrlTtlSeconds: 300,
      videoWatermarkLimitation:
        "Videos are not re-encoded with a burned-in watermark in version one. Poster images are watermarked; preview playback uses a visible overlay.",
      notALawFirm:
        "GoodHuman is not a law firm. Document tools are informational and do not constitute legal advice.",
    });
    assert.equal(parsed.productName, "GoodHuman");
  });
});
