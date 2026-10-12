import { Hono } from "hono";
import { CreateInquirySchema, SendMessageSchema } from "@goodhuman/shared";
import { prisma } from "../db.js";
import {
  requireAuth,
  type AppVariables,
} from "../auth/middleware.js";
import { rateLimit } from "../rate-limit.js";

export const inquiryRoutes = new Hono<{ Variables: AppVariables }>();

function mapMessage(m: {
  id: string;
  inquiryId: string;
  senderId: string;
  body: string;
  createdAt: Date;
  sender: { role: string };
}) {
  return {
    id: m.id,
    inquiryId: m.inquiryId,
    senderId: m.senderId,
    senderRole: m.sender.role,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  };
}

inquiryRoutes.post(
  "/",
  requireAuth,
  rateLimit({ key: "inquiry", limit: 30, windowMs: 60_000 }),
  async (c) => {
    const user = c.get("user");
    if (user.role !== "BOOKER" && user.role !== "ADMIN") {
      return c.json({ error: "Only bookers can send inquiries." }, 403);
    }
    const body = CreateInquirySchema.parse(await c.req.json());

    const artist = await prisma.artistProfile.findFirst({
      where: { id: body.artistProfileId, published: true },
    });
    if (!artist) return c.json({ error: "Artist not found." }, 404);

    const inquiry = await prisma.inquiry.create({
      data: {
        artistProfileId: artist.id,
        bookerId: user.id,
        eventDate: new Date(`${body.eventDate}T00:00:00.000Z`),
        eventTimezone: body.eventTimezone,
        city: body.city,
        venueName: body.venueName ?? null,
        messages: {
          create: {
            senderId: user.id,
            body: body.message,
          },
        },
      },
      include: {
        artistProfile: true,
        booker: true,
        messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
      },
    });

    await prisma.analyticsEvent.create({
      data: {
        name: "inquiry sent",
        userId: user.id,
        metaJson: { inquiryId: inquiry.id, artistProfileId: artist.id },
      },
    });

    return c.json(
      {
        id: inquiry.id,
        artistProfileId: inquiry.artistProfileId,
        artistActName: inquiry.artistProfile.actName,
        bookerId: inquiry.bookerId,
        bookerDisplayName: inquiry.booker.displayName,
        eventDate: inquiry.eventDate.toISOString().slice(0, 10),
        eventTimezone: inquiry.eventTimezone,
        city: inquiry.city,
        venueName: inquiry.venueName,
        status: inquiry.status,
        createdAt: inquiry.createdAt.toISOString(),
        messages: inquiry.messages.map(mapMessage),
      },
      201,
    );
  },
);

inquiryRoutes.get("/", requireAuth, async (c) => {
  const user = c.get("user");
  const where =
    user.role === "ARTIST"
      ? { artistProfile: { userId: user.id } }
      : user.role === "BOOKER"
        ? { bookerId: user.id }
        : {};

  const inquiries = await prisma.inquiry.findMany({
    where,
    include: {
      artistProfile: true,
      booker: true,
      messages: {
        include: { sender: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return c.json({
    results: inquiries.map((inq) => ({
      id: inq.id,
      artistProfileId: inq.artistProfileId,
      artistActName: inq.artistProfile.actName,
      bookerId: inq.bookerId,
      bookerDisplayName: inq.booker.displayName,
      eventDate: inq.eventDate.toISOString().slice(0, 10),
      eventTimezone: inq.eventTimezone,
      city: inq.city,
      venueName: inq.venueName,
      status: inq.status,
      createdAt: inq.createdAt.toISOString(),
      latestMessage: inq.messages[0] ? mapMessage(inq.messages[0]) : null,
    })),
  });
});

inquiryRoutes.get("/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: c.req.param("id") },
    include: {
      artistProfile: true,
      booker: true,
      messages: { include: { sender: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!inquiry) return c.json({ error: "Not found" }, 404);

  const isArtist = inquiry.artistProfile.userId === user.id;
  const isBooker = inquiry.bookerId === user.id;
  if (!isArtist && !isBooker && user.role !== "ADMIN") {
    return c.json({ error: "Forbidden" }, 403);
  }

  return c.json({
    id: inquiry.id,
    artistProfileId: inquiry.artistProfileId,
    artistActName: inquiry.artistProfile.actName,
    bookerId: inquiry.bookerId,
    bookerDisplayName: inquiry.booker.displayName,
    eventDate: inquiry.eventDate.toISOString().slice(0, 10),
    eventTimezone: inquiry.eventTimezone,
    city: inquiry.city,
    venueName: inquiry.venueName,
    status: inquiry.status,
    createdAt: inquiry.createdAt.toISOString(),
    messages: inquiry.messages.map(mapMessage),
  });
});

inquiryRoutes.post(
  "/:id/messages",
  requireAuth,
  rateLimit({ key: "chat", limit: 60, windowMs: 60_000 }),
  async (c) => {
    const user = c.get("user");
    const body = SendMessageSchema.parse(await c.req.json());
    const inquiry = await prisma.inquiry.findUnique({
      where: { id: c.req.param("id") },
      include: { artistProfile: true },
    });
    if (!inquiry) return c.json({ error: "Not found" }, 404);

    const isArtist = inquiry.artistProfile.userId === user.id;
    const isBooker = inquiry.bookerId === user.id;
    if (!isArtist && !isBooker && user.role !== "ADMIN") {
      return c.json({ error: "Forbidden" }, 403);
    }

    const message = await prisma.message.create({
      data: {
        inquiryId: inquiry.id,
        senderId: user.id,
        body: body.body,
      },
      include: { sender: true },
    });

    await prisma.inquiry.update({
      where: { id: inquiry.id },
      data: { updatedAt: new Date() },
    });

    return c.json(mapMessage(message), 201);
  },
);
