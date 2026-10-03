import { Hono } from "hono";
import {
  ArtistSearchQuerySchema,
  PublishArtistProfileSchema,
  SetAvailabilitySchema,
  UpsertArtistProfileSchema,
} from "@goodhuman/shared";
import { prisma } from "../db.js";
import {
  requireAuth,
  requireRole,
  type AppVariables,
} from "../auth/middleware.js";
import {
  assertNoContactLeak,
  toPublicArtistProfile,
} from "../mappers/artist.js";

export const artistRoutes = new Hono<{ Variables: AppVariables }>();

const includePublic = {
  media: { orderBy: { createdAt: "asc" as const } },
  availability: { orderBy: { date: "asc" as const }, where: { open: true } },
  socialLinks: true,
};

artistRoutes.get("/search", async (c) => {
  const query = ArtistSearchQuerySchema.parse(c.req.query());
  const artists = await prisma.artistProfile.findMany({
    where: {
      published: true,
      ...(query.city ? { city: { equals: query.city, mode: "insensitive" } } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.travelScope ? { travelScope: query.travelScope } : {}),
      ...(query.country ? { country: query.country.toUpperCase() } : {}),
      ...(query.q
        ? {
            OR: [
              { actName: { contains: query.q, mode: "insensitive" } },
              { bio: { contains: query.q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: includePublic,
    orderBy: [{ spotlight: "desc" }, { publishedAt: "desc" }],
    take: query.limit,
    skip: query.offset,
  });

  const results = artists.map(toPublicArtistProfile);
  for (const r of results) assertNoContactLeak(r);
  return c.json({ results, limit: query.limit, offset: query.offset });
});

artistRoutes.get("/me/profile", requireAuth, requireRole("ARTIST"), async (c) => {
  const user = c.get("user");
  const artist = await prisma.artistProfile.findUnique({
    where: { userId: user.id },
    include: includePublic,
  });
  if (!artist) return c.json({ error: "Profile not created yet." }, 404);
  return c.json(toPublicArtistProfile(artist));
});

artistRoutes.put("/me/profile", requireAuth, requireRole("ARTIST"), async (c) => {
  const user = c.get("user");
  const body = UpsertArtistProfileSchema.parse(await c.req.json());

  if (body.openToTravel && !body.travelScope) {
    return c.json({ error: "Travel scope is required when open to travel." }, 400);
  }

  const data = {
    actName: body.actName,
    bio: body.bio ?? null,
    category: body.category,
    city: body.city,
    country: body.country ?? "US",
    region: body.region ?? null,
    travelScope: body.travelScope,
    openToTravel: body.openToTravel,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
  };

  const artist = await prisma.artistProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
    include: includePublic,
  });

  if (body.socialLinks) {
    await prisma.socialLink.deleteMany({ where: { artistProfileId: artist.id } });
    if (body.socialLinks.length) {
      await prisma.socialLink.createMany({
        data: body.socialLinks.map((s) => ({
          artistProfileId: artist.id,
          platform: s.platform,
          url: s.url,
        })),
      });
    }
  }

  const refreshed = await prisma.artistProfile.findUniqueOrThrow({
    where: { id: artist.id },
    include: includePublic,
  });
  return c.json(toPublicArtistProfile(refreshed));
});

artistRoutes.post("/me/publish", requireAuth, requireRole("ARTIST"), async (c) => {
  PublishArtistProfileSchema.parse(await c.req.json());
  const user = c.get("user");
  const artist = await prisma.artistProfile.findUnique({
    where: { userId: user.id },
    include: {
      media: { where: { status: "READY", kind: "IMAGE" } },
      availability: { where: { open: true } },
    },
  });
  if (!artist) return c.json({ error: "Create a profile first." }, 400);

  const missing: string[] = [];
  if (!artist.city) missing.push("city");
  if (!artist.category) missing.push("category");
  if (!artist.travelScope || artist.openToTravel === null) missing.push("travel flag");
  if (artist.media.length < 1) missing.push("one image");
  if (artist.availability.length < 1) missing.push("an open date");

  if (missing.length) {
    return c.json(
      { error: `Cannot publish yet. Missing: ${missing.join(", ")}.` },
      400,
    );
  }

  const updated = await prisma.artistProfile.update({
    where: { id: artist.id },
    data: { published: true, publishedAt: new Date() },
    include: includePublic,
  });

  await prisma.analyticsEvent.create({
    data: { name: "profile published", userId: user.id, metaJson: { artistProfileId: artist.id } },
  });

  return c.json(toPublicArtistProfile(updated));
});

artistRoutes.put("/me/availability", requireAuth, requireRole("ARTIST"), async (c) => {
  const user = c.get("user");
  const body = SetAvailabilitySchema.parse(await c.req.json());
  const artist = await prisma.artistProfile.findUnique({ where: { userId: user.id } });
  if (!artist) return c.json({ error: "Create a profile first." }, 400);

  for (const d of body.dates) {
    const date = new Date(`${d.date}T00:00:00.000Z`);
    await prisma.availabilityDate.upsert({
      where: {
        artistProfileId_date: { artistProfileId: artist.id, date },
      },
      create: {
        artistProfileId: artist.id,
        date,
        timezone: d.timezone,
        open: d.open,
        note: d.note ?? null,
      },
      update: {
        timezone: d.timezone,
        open: d.open,
        note: d.note ?? null,
      },
    });
  }

  const availability = await prisma.availabilityDate.findMany({
    where: { artistProfileId: artist.id },
    orderBy: { date: "asc" },
  });

  return c.json({
    dates: availability.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      timezone: d.timezone,
      open: d.open,
      note: d.note,
    })),
  });
});

artistRoutes.get("/:id", async (c) => {
  const artist = await prisma.artistProfile.findFirst({
    where: { id: c.req.param("id"), published: true },
    include: includePublic,
  });
  if (!artist) return c.json({ error: "Artist not found." }, 404);
  const publicProfile = toPublicArtistProfile(artist);
  assertNoContactLeak(publicProfile);
  return c.json(publicProfile);
});
