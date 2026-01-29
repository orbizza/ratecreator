/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: [
    "@ratecreator/ui",
    "@ratecreator/db",
    "@ratecreator/actions",
    "@ratecreator/auth",
    "@ratecreator/store",
    "@ratecreator/types",
    "@ratecreator/hooks",
  ],
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
      "p16-sign-sg.tiktokcdn.com",
      "p16-sign-va.tiktokcdn.com",
      "scontent.cdninstagram.com",
    ],
  },
};

export default nextConfig;
