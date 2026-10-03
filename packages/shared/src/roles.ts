import { z } from "zod";

export const UserRoleSchema = z.enum(["ARTIST", "BOOKER", "ADMIN"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const BookerSubtypeSchema = z.enum(["INDIVIDUAL", "VENUE", "PROMOTER", "PLANNER"]);
export type BookerSubtype = z.infer<typeof BookerSubtypeSchema>;
