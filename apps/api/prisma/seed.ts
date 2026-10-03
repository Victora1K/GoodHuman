import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { watermarkImage } from "../src/media/watermark.js";

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.availabilityDate.deleteMany();
  await prisma.socialLink.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.artistProfile.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 10);

  const artistUser = await prisma.user.create({
    data: {
      email: "artist@goodhuman.test",
      passwordHash,
      role: "ARTIST",
      displayName: "Maya Rivers",
      ageConfirmedAt: new Date(),
    },
  });

  const bookerUser = await prisma.user.create({
    data: {
      email: "booker@goodhuman.test",
      passwordHash,
      role: "BOOKER",
      displayName: "River Hall",
      bookerSubtype: "VENUE",
      venueAddress: "100 Market St, Austin, TX",
      ageConfirmedAt: new Date(),
    },
  });

  const artist = await prisma.artistProfile.create({
    data: {
      userId: artistUser.id,
      actName: "Maya Rivers",
      bio: "Soulful indie sets for rooms that listen.",
      category: "SOLO_MUSICIAN",
      city: "Austin",
      country: "US",
      region: "TX",
      travelScope: "NATIONAL",
      openToTravel: true,
      latitude: 30.2672,
      longitude: -97.7431,
      published: true,
      publishedAt: new Date(),
      socialLinks: {
        create: [
          {
            platform: "INSTAGRAM",
            url: "https://instagram.com/mayarivers.example",
          },
        ],
      },
      availability: {
        create: [
          {
            date: new Date("2026-11-14T00:00:00.000Z"),
            timezone: "America/Chicago",
            open: true,
          },
        ],
      },
    },
  });

  const storageRoot = path.resolve(process.env.STORAGE_LOCAL_ROOT ?? "./storage");
  const originalKey = `originals/seed-${artist.id}.jpg`;
  const previewKey = `previews/seed-${artist.id}.jpg`;

  const original = await sharp({
    create: {
      width: 1200,
      height: 800,
      channels: 3,
      background: { r: 42, g: 74, b: 68 },
    },
  })
    .jpeg()
    .toBuffer();

  const preview = await watermarkImage(original);
  await mkdir(path.join(storageRoot, "originals"), { recursive: true });
  await mkdir(path.join(storageRoot, "previews"), { recursive: true });
  await writeFile(path.join(storageRoot, originalKey), original);
  await writeFile(path.join(storageRoot, previewKey), preview);
  await writeFile(path.join(storageRoot, `${previewKey}.public`), "1");

  await prisma.mediaAsset.create({
    data: {
      ownerId: artistUser.id,
      artistProfileId: artist.id,
      kind: "IMAGE",
      mimeType: "image/jpeg",
      byteSize: original.byteLength,
      originalKey,
      previewKey,
      status: "READY",
      watermarkedPreview: true,
      isPublicPreview: true,
    },
  });

  console.log("Seeded artist@goodhuman.test / booker@goodhuman.test (password123)");
  console.log(`Artist profile id: ${artist.id}`);
  console.log(`Booker id: ${bookerUser.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
