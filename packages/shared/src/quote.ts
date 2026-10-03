import { z } from "zod";
import { TravelModeSchema, TravelScopeSchema } from "./travel.js";

/**
 * Quote / review schemas for later phases. Kept in shared so Phase 2+
 * does not reshape identity. Not exposed in Phase 1 UI.
 */
export const QuoteDraftSchema = z.object({
  inquiryId: z.string().uuid(),
  totalCents: z.number().int().positive(),
  currency: z.literal("USD").default("USD"),
  depositPercent: z.union([
    z.literal(0.25),
    z.literal(0.5),
    z.literal(1),
  ]),
  travelMode: TravelModeSchema,
  travelScope: TravelScopeSchema,
  includedScope: z.string().min(1).max(8000),
  bookingFeeRate: z.number().min(0).max(1),
  expiresAt: z.string().datetime(),
});
export type QuoteDraft = z.infer<typeof QuoteDraftSchema>;

export const ReviewClauseStatusSchema = z.enum([
  "present",
  "missing",
  "unclear",
  "extraction_error",
]);

export const ReviewResultSchema = z.object({
  documentId: z.string().uuid(),
  extractionError: z.boolean(),
  clauses: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      status: ReviewClauseStatusSchema,
      excerpt: z.string().nullable(),
      note: z.string().nullable(),
    }),
  ),
  disclaimer:
    z.literal("Not a law firm. This checklist is informational only."),
});
export type ReviewResult = z.infer<typeof ReviewResultSchema>;
