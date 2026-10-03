import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { serverConfig } from "./config.js";

const app = createApp();

serve({ fetch: app.fetch, port: serverConfig.port }, (info) => {
  console.log(`GoodHuman API listening on http://localhost:${info.port}`);
});
