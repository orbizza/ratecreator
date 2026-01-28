import { withSentryConfig } from "@sentry/nextjs";
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
    domains: [
      "yt3.googleusercontent.com",
      "lh3.googleusercontent.com",
      "yt4.ggpht.com",
      "ratecreator.nyc3.cdn.digitaloceanspaces.com",
      "img.clerk.com",
      "img.clerk.com/avatars",
      "pbs.twimg.com",
      "x.com",
      "i.redd.it",
      "a.thumbs.redditmedia.com",
      "b.thumbs.redditmedia.com",
      "external-preview.redd.it",
      "reddit.com",
      "redditmedia.com",
      "styles.redditmedia.com",
      // ... any other domains you're using
    ],
  },
  // ... other config options
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: "orbizza-inc",
  project: "ratecreator-web",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,

  // Handle Sentry CLI errors gracefully to prevent build failures due to API timeouts
  errorHandler: (err, invokeErr, compilation) => {
    console.warn("Sentry CLI warning:", err.message);
    // Don't invoke the error - this prevents build failure on Sentry API issues
  },
});
