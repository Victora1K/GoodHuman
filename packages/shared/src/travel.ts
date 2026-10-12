import { z } from "zod";

export const TravelScopeSchema = z.enum(["LOCAL", "NATIONAL", "INTERNATIONAL"]);
export type TravelScope = z.infer<typeof TravelScopeSchema>;

export const TravelModeSchema = z.enum(["ARTIST_TRAVELS", "BOOKER_COVERS", "NO_TRAVEL"]);
export type TravelMode = z.infer<typeof TravelModeSchema>;
