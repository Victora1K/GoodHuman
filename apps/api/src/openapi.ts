/** Minimal OpenAPI document published from the API (PLAN §14). */
export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "GoodHuman API",
    version: "0.1.0",
    description:
      "Phase 1: auth, artist profiles, search, availability, inquiry chat, private media with watermarked previews.",
  },
  servers: [{ url: "/" }],
  paths: {
    "/health": {
      get: { summary: "Health", responses: { "200": { description: "OK" } } },
    },
    "/config": {
      get: { summary: "Public app config", responses: { "200": { description: "Config" } } },
    },
    "/auth/signup": {
      post: { summary: "Sign up (18+)", responses: { "201": { description: "Created" } } },
    },
    "/auth/login": {
      post: { summary: "Login", responses: { "200": { description: "Token" } } },
    },
    "/auth/me": {
      get: { summary: "Current user", responses: { "200": { description: "User" } } },
    },
    "/artists/search": {
      get: {
        summary: "Search published artists",
        parameters: [
          { name: "city", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Results" } },
      },
    },
    "/artists/{id}": {
      get: { summary: "Public artist profile (no contact fields)", responses: { "200": { description: "Profile" } } },
    },
    "/artists/me/profile": {
      get: { summary: "Own artist profile", responses: { "200": { description: "Profile" } } },
      put: { summary: "Upsert artist profile", responses: { "200": { description: "Profile" } } },
    },
    "/artists/me/publish": {
      post: { summary: "Publish profile", responses: { "200": { description: "Published" } } },
    },
    "/artists/me/availability": {
      put: { summary: "Set availability dates", responses: { "200": { description: "Dates" } } },
    },
    "/media/upload": {
      post: { summary: "Upload media (private original)", responses: { "201": { description: "Media" } } },
    },
    "/media/{id}": {
      get: {
        summary: "Get preview (public) or original signed URL (owner)",
        parameters: [
          { name: "variant", in: "query", schema: { type: "string", enum: ["preview", "original"] } },
        ],
        responses: { "200": { description: "URL" } },
      },
    },
    "/inquiries": {
      get: { summary: "List inquiries for current user", responses: { "200": { description: "List" } } },
      post: { summary: "Create inquiry", responses: { "201": { description: "Created" } } },
    },
    "/inquiries/{id}": {
      get: { summary: "Inquiry thread", responses: { "200": { description: "Inquiry" } } },
    },
    "/inquiries/{id}/messages": {
      post: { summary: "Send chat message", responses: { "201": { description: "Message" } } },
    },
  },
} as const;
