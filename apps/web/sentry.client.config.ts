// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Only initialize Sentry in production
if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production") {
  Sentry.init({
    dsn: "https://5c8b8a1d0f56e649e6e5ab7a468807a0@o4508850647334912.ingest.us.sentry.io/4508850649890816",

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: 1,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
  });
}
