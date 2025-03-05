/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://ratecreator.com",
  generateRobotsTxt: false, // Since we already have a custom robots.txt
  generateIndexSitemap: false, // Since we're using dynamic sitemap generation
  exclude: ["/api/*", "/admin/*", "/private/*"],
  outDir: "./public",
};
