import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { closePubSubClient } from "@ratecreator/db/pubsub-client";
import { getPrismaClient } from "@ratecreator/db/client";

// Routes
import { healthRoute } from "./routes/health";
import { userSyncRoute } from "./routes/user-sync";
import { dataFetchRoute } from "./routes/data-fetch";
import { translateRoute } from "./routes/translate";
import { categoriseRootRoute } from "./routes/categorise-root";
import { categoriseSubRoute } from "./routes/categorise-sub";
import { elasticAccountSyncRoute } from "./routes/elastic-account-sync";
import { reviewCalculateRoute } from "./routes/review-calculate";
import { reviewElasticUpdateRoute } from "./routes/review-elastic-update";
import { youtubeRefreshRoute } from "./routes/youtube-refresh";
import { instagramRefreshRoute } from "./routes/instagram-refresh";
import { redditRefreshRoute } from "./routes/reddit-refresh";
import { tiktokRefreshRoute } from "./routes/tiktok-refresh";
import { refreshSchedulerRoute } from "./routes/refresh-scheduler";
import { clerkWebhookRoute } from "./routes/clerk-webhook";

// Auth middleware for /jobs/* — verifies Pub/Sub OIDC token (or dev token).
import { requireWorkerAuth } from "./lib/auth-middleware";

// Pull subscriber for local dev
import {
  startPullSubscribers,
  stopPullSubscribers,
} from "./lib/pull-subscriber";

const app = new Hono();

// Health check is public (used by Cloud Run probes).
app.route("/health", healthRoute);

// Clerk webhook: verifies Svix signature inside the route — keep public.
app.route("/webhook/clerk", clerkWebhookRoute);

// Every /jobs/* route requires a verified Pub/Sub OIDC token.
app.use("/jobs/*", requireWorkerAuth);

app.route("/jobs/user-sync", userSyncRoute);
app.route("/jobs/data-fetch", dataFetchRoute);
app.route("/jobs/translate", translateRoute);
app.route("/jobs/categorise-root", categoriseRootRoute);
app.route("/jobs/categorise-sub", categoriseSubRoute);
app.route("/jobs/elastic-account-sync", elasticAccountSyncRoute);
app.route("/jobs/review-calculate", reviewCalculateRoute);
app.route("/jobs/review-elastic-update", reviewElasticUpdateRoute);
app.route("/jobs/youtube-refresh", youtubeRefreshRoute);
app.route("/jobs/instagram-refresh", instagramRefreshRoute);
app.route("/jobs/reddit-refresh", redditRefreshRoute);
app.route("/jobs/tiktok-refresh", tiktokRefreshRoute);
app.route("/jobs/refresh-scheduler", refreshSchedulerRoute);

const port = parseInt(process.env.PORT || "8080");

// Pull subscriber for local development only
const enablePull =
  process.env.ENABLE_PULL_SUBSCRIBER === "true" ||
  (process.env.NODE_ENV !== "production" && !!process.env.GCP_PROJECT_ID);

const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║       Rate Creator Worker Service            ║
╠══════════════════════════════════════════════╣
║  Port: ${String(port).padEnd(37)}║
║  Environment: ${(process.env.NODE_ENV || "development").padEnd(30)}║
║  Pull Subscriber: ${(enablePull ? "ENABLED" : "disabled").padEnd(25)}║
║  Endpoints: 13 job routes + webhook            ║
╚══════════════════════════════════════════════╝
  `);

  if (enablePull) {
    startPullSubscribers().catch((err) =>
      console.error("[pull-subscriber] Failed to start:", err),
    );
  }
});

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down worker service...");
  await stopPullSubscribers();
  await closePubSubClient();
  await getPrismaClient().$disconnect();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
