import { z } from "zod";

export const CreateInquirySchema = z.object({
  artistProfileId: z.string().uuid(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eventTimezone: z.string().min(1),
  city: z.string().min(1).max(120),
  venueName: z.string().max(200).optional(),
  message: z.string().min(1).max(4000),
});
export type CreateInquiryInput = z.infer<typeof CreateInquirySchema>;

export const SendMessageSchema = z.object({
  body: z.string().min(1).max(8000),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const MessageSchema = z.object({
  id: z.string().uuid(),
  inquiryId: z.string().uuid(),
  senderId: z.string().uuid(),
  senderRole: z.enum(["ARTIST", "BOOKER", "ADMIN"]),
  body: z.string(),
  createdAt: z.string().datetime(),
});
export type Message = z.infer<typeof MessageSchema>;

export const InquirySchema = z.object({
  id: z.string().uuid(),
  artistProfileId: z.string().uuid(),
  artistActName: z.string(),
  bookerId: z.string().uuid(),
  bookerDisplayName: z.string(),
  eventDate: z.string(),
  eventTimezone: z.string(),
  city: z.string(),
  venueName: z.string().nullable(),
  status: z.enum(["OPEN", "QUOTED", "CLOSED"]),
  createdAt: z.string().datetime(),
  latestMessage: MessageSchema.nullable().optional(),
});
export type Inquiry = z.infer<typeof InquirySchema>;
