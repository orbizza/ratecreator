/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "yt3.googleusercontent.com",
      "lh3.googleusercontent.com",
      "yt4.ggpht.com",
      "ratecreator.nyc3.cdn.digitaloceanspaces.com",
      "img.clerk.com",
      "img.clerk.com/avatars",
      // ... any other domains you're using
    ],
  },
  // ... other config options
};

export default nextConfig;
