/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "yt3.googleusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "yt4.ggpht.com" },
      { protocol: "https", hostname: "ratecreator.nyc3.cdn.digitaloceanspaces.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "i.redd.it" },
      { protocol: "https", hostname: "**.redditmedia.com" },
      { protocol: "https", hostname: "external-preview.redd.it" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
  // Proxy PostHog requests through our domain to bypass ad blockers
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  // Security headers for every response served by this app.
  // CSP is intentionally not set here yet — adding one safely requires
  // auditing every inline script, third-party origin (Clerk, PostHog,
  // YouTube embeds, etc.); ship the easy wins first.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
