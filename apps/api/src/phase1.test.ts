import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { createApp } from "./app.js";
import { processWatermarkJob } from "./jobs/watermark-processor.js";
import { closeJobInfrastructure } from "./jobs/queue.js";

process.env.GH_INLINE_WATERMARK = "1";
process.env.STORAGE_LOCAL_ROOT = "./storage-test";

const prisma = new PrismaClient();
const app = createApp();

async function json(
  path: string,
  init: RequestInit & { token?: string } = {},
) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  if (init.token) headers.set("authorization", `Bearer ${init.token}`);
  const res = await app.request(path, { ...init, headers });
  const body = await res.json();
  return { res, body };
}

describe("Phase 1 acceptance", () => {
  before(async () => {
    await prisma.message.deleteMany();
    await prisma.inquiry.deleteMany();
    await prisma.availabilityDate.deleteMany();
    await prisma.socialLink.deleteMany();
    await prisma.mediaAsset.deleteMany();
    await prisma.artistProfile.deleteMany();
    await prisma.analyticsEvent.deleteMany();
    await prisma.user.deleteMany();
  });

  after(async () => {
    await closeJobInfrastructure();
    await prisma.$disconnect();
  });

  it("requires travel flag on artist profile upsert", async () => {
    const signup = await json("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: `travel-${Date.now()}@test.local`,
        password: "password123",
        role: "ARTIST",
        displayName: "Travel Tester",
        ageConfirmed18Plus: true,
      }),
    });
    assert.equal(signup.res.status, 201);

    const missing = await json("/artists/me/profile", {
      method: "PUT",
      token: signup.body.token,
      body: JSON.stringify({
        actName: "No Travel",
        category: "DJ",
        city: "Austin",
        openToTravel: true,
      }),
    });
    assert.equal(missing.res.status, 400);
    assert.match(JSON.stringify(missing.body), /travelScope|Validation failed/i);
  });

  it("hides artist email on public profile and search", async () => {
    const artistSignup = await json("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: `artist-priv-${Date.now()}@secret.example`,
        password: "password123",
        role: "ARTIST",
        displayName: "Private Act",
        ageConfirmed18Plus: true,
      }),
    });
    assert.equal(artistSignup.res.status, 201);
    const token = artistSignup.body.token as string;
    const email = artistSignup.body.user.email as string;

    await json("/artists/me/profile", {
      method: "PUT",
      token,
      body: JSON.stringify({
        actName: "Private Act",
        category: "DJ",
        city: "Austin",
        country: "US",
        travelScope: "LOCAL",
        openToTravel: false,
      }),
    });

    const png = await sharp({
      create: { width: 640, height: 480, channels: 3, background: "#2a4a44" },
    })
      .png()
      .toBuffer();

    const form = new FormData();
    form.append("file", new File([png], "cover.png", { type: "image/png" }));
    const uploadRes = await app.request("/media/upload", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: form,
    });
    const uploadBody = await uploadRes.json();
    assert.equal(uploadRes.status, 201);
    if (uploadBody.status !== "READY") {
      await processWatermarkJob({ data: { mediaId: uploadBody.id } } as never);
    }

    await json("/artists/me/availability", {
      method: "PUT",
      token,
      body: JSON.stringify({
        dates: [{ date: "2026-12-01", timezone: "America/Chicago", open: true }],
      }),
    });

    const published = await json("/artists/me/publish", {
      method: "POST",
      token,
      body: JSON.stringify({ confirm: true }),
    });
    assert.equal(published.res.status, 200, JSON.stringify(published.body));

    const profile = await json(`/artists/${published.body.id}`);
    assert.equal(profile.res.status, 200);
    assert.equal(JSON.stringify(profile.body).includes(email), false);
    assert.equal("email" in profile.body, false);
    assert.equal(JSON.stringify(profile.body).includes("originalKey"), false);

    const search = await json("/artists/search?city=Austin&category=DJ");
    assert.equal(search.res.status, 200);
    assert.equal(JSON.stringify(search.body).includes(email), false);
    assert.ok(search.body.results.some((r: { id: string }) => r.id === published.body.id));
  });

  it("exposes preview URLs publicly but keeps original URLs private", async () => {
    const artistSignup = await json("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: `artist-media-${Date.now()}@test.local`,
        password: "password123",
        role: "ARTIST",
        displayName: "Media Act",
        ageConfirmed18Plus: true,
      }),
    });
    const token = artistSignup.body.token as string;

    await json("/artists/me/profile", {
      method: "PUT",
      token,
      body: JSON.stringify({
        actName: "Media Act",
        category: "BAND",
        city: "Dallas",
        travelScope: "NATIONAL",
        openToTravel: true,
      }),
    });

    const jpg = await sharp({
      create: { width: 800, height: 600, channels: 3, background: "#c4a35a" },
    })
      .jpeg()
      .toBuffer();

    const form = new FormData();
    form.append("file", new File([jpg], "shot.jpg", { type: "image/jpeg" }));
    const uploadRes = await app.request("/media/upload", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: form,
    });
    const media = await uploadRes.json();
    assert.equal(uploadRes.status, 201);
    if (media.status !== "READY") {
      await processWatermarkJob({ data: { mediaId: media.id } } as never);
      const again = await json(`/media/${media.id}`, { token });
      Object.assign(media, {
        status: "READY",
        previewUrl: again.body.url,
        id: media.id,
      });
    }

    const preview = await json(`/media/${media.id}`, { token });
    assert.equal(preview.res.status, 200);
    assert.equal(preview.body.public, true);
    assert.ok(String(preview.body.url).includes("/public/"));

    const bookerSignup = await json("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: `booker-media-${Date.now()}@test.local`,
        password: "password123",
        role: "BOOKER",
        displayName: "Curious Booker",
        ageConfirmed18Plus: true,
        bookerSubtype: "INDIVIDUAL",
      }),
    });

    const stolen = await json(`/media/${media.id}?variant=original`, {
      token: bookerSignup.body.token,
    });
    assert.equal(stolen.res.status, 403);

    const ownerOriginal = await json(`/media/${media.id}?variant=original`, {
      token,
    });
    assert.equal(ownerOriginal.res.status, 200);
    assert.equal(ownerOriginal.body.public, false);
    assert.ok(String(ownerOriginal.body.url).includes("/media/signed"));
    assert.equal(String(ownerOriginal.body.url).includes("/public/"), false);

    // Direct public path must not serve originals.
    const mediaRow = await prisma.mediaAsset.findUniqueOrThrow({ where: { id: media.id } });
    const blocked = await app.request(`/public/${mediaRow.originalKey}`);
    assert.equal(blocked.status, 404);
  });

  it("supports inquiry chat between booker and artist", async () => {
    const suffix = Date.now();
    const artistSignup = await json("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: `artist-chat-${suffix}@test.local`,
        password: "password123",
        role: "ARTIST",
        displayName: "Chat Act",
        ageConfirmed18Plus: true,
      }),
    });
    const artistToken = artistSignup.body.token as string;

    await json("/artists/me/profile", {
      method: "PUT",
      token: artistToken,
      body: JSON.stringify({
        actName: "Chat Act",
        category: "COMEDIAN",
        city: "Houston",
        travelScope: "LOCAL",
        openToTravel: false,
      }),
    });

    const png = await sharp({
      create: { width: 400, height: 400, channels: 3, background: "#333" },
    })
      .png()
      .toBuffer();
    const form = new FormData();
    form.append("file", new File([png], "a.png", { type: "image/png" }));
    const uploadRes = await app.request("/media/upload", {
      method: "POST",
      headers: { authorization: `Bearer ${artistToken}` },
      body: form,
    });
    const uploaded = await uploadRes.json();
    if (uploaded.status !== "READY") {
      await processWatermarkJob({ data: { mediaId: uploaded.id } } as never);
    }

    await json("/artists/me/availability", {
      method: "PUT",
      token: artistToken,
      body: JSON.stringify({
        dates: [{ date: "2026-10-20", timezone: "America/Chicago", open: true }],
      }),
    });
    const published = await json("/artists/me/publish", {
      method: "POST",
      token: artistToken,
      body: JSON.stringify({ confirm: true }),
    });

    const bookerSignup = await json("/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        email: `booker-chat-${suffix}@test.local`,
        password: "password123",
        role: "BOOKER",
        displayName: "Promoter Pat",
        ageConfirmed18Plus: true,
        bookerSubtype: "PROMOTER",
      }),
    });

    const inquiry = await json("/inquiries", {
      method: "POST",
      token: bookerSignup.body.token,
      body: JSON.stringify({
        artistProfileId: published.body.id,
        eventDate: "2026-10-20",
        eventTimezone: "America/Chicago",
        city: "Houston",
        message: "Are you free for a rooftop set?",
      }),
    });
    assert.equal(inquiry.res.status, 201, JSON.stringify(inquiry.body));

    const artistInbox = await json("/inquiries", { token: artistToken });
    assert.ok(artistInbox.body.results.some((r: { id: string }) => r.id === inquiry.body.id));

    const reply = await json(`/inquiries/${inquiry.body.id}/messages`, {
      method: "POST",
      token: artistToken,
      body: JSON.stringify({ body: "Yes — send details and budget." }),
    });
    assert.equal(reply.res.status, 201);

    const thread = await json(`/inquiries/${inquiry.body.id}`, {
      token: bookerSignup.body.token,
    });
    assert.equal(thread.body.messages.length, 2);
    assert.equal(JSON.stringify(thread.body).includes("artist-chat-"), false);
  });
});
