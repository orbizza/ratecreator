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
};

export default nextConfig;
