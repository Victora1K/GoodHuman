import { z } from "zod";
import { BookerSubtypeSchema, UserRoleSchema } from "./roles.js";

export const SignupSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
  role: z.enum(["ARTIST", "BOOKER"]),
  displayName: z.string().min(1).max(120),
  ageConfirmed18Plus: z.literal(true, {
    errorMap: () => ({ message: "You must confirm you are 18 or older." }),
  }),
  bookerSubtype: BookerSubtypeSchema.optional(),
  venueAddress: z.string().max(500).optional(),
});
export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: UserRoleSchema,
  displayName: z.string(),
  premium: z.boolean(),
  bookerSubtype: BookerSubtypeSchema.nullable(),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthResponseSchema = z.object({
  token: z.string(),
  user: AuthUserSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
