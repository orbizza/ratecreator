/**
 * Environment-based URL configuration for RateCreator apps
 *
 * Handles URLs for:
 * - ratecreator.com (main web app)
 * - creator.ratecreator.com (creator portal / creatorops)
 * - content.ratecreator.com (content management)
 *
 * Environments:
 * - local: localhost development
 * - dev: development/staging servers
 * - production: live production servers
 */

export type Environment = "local" | "development" | "production";

export type AppType = "web" | "creatorops" | "content";

interface UrlConfig {
  web: string;
  creatorops: string;
  content: string;
  api: string;
}

const URL_CONFIGS: Record<Environment, UrlConfig> = {
  local: {
    web: "http://localhost:3000",
    creatorops: "http://localhost:3001",
    content: "http://localhost:3002",
    api: "http://localhost:3000/api",
  },
  development: {
    web: "https://dev.ratecreator.com",
    creatorops: "https://creator-dev.ratecreator.com",
    content: "https://content-dev.ratecreator.com",
    api: "https://dev.ratecreator.com/api",
  },
  production: {
    web: "https://ratecreator.com",
    creatorops: "https://creator.ratecreator.com",
    content: "https://content.ratecreator.com",
    api: "https://ratecreator.com/api",
  },
};

/**
 * Get the current environment based on NODE_ENV and custom env vars
 */
export function getEnvironment(): Environment {
  const nodeEnv = process.env.NODE_ENV;
  const customEnv = process.env.NEXT_PUBLIC_APP_ENV || process.env.APP_ENV;

  if (customEnv === "production" || nodeEnv === "production") {
    return "production";
  }

  if (customEnv === "development" || customEnv === "dev") {
    return "development";
  }

  // Default to local for development
  return "local";
}

/**
 * Get URL for a specific app in the current environment
 */
export function getAppUrl(app: AppType): string {
  const env = getEnvironment();
  return URL_CONFIGS[env][app];
}

/**
 * Get all URLs for the current environment
 */
export function getUrls(): UrlConfig {
  const env = getEnvironment();
  return URL_CONFIGS[env];
}

/**
 * Get URL for a specific app in a specific environment
 */
export function getAppUrlForEnv(app: AppType, env: Environment): string {
  return URL_CONFIGS[env][app];
}

/**
 * Get the web app URL (ratecreator.com)
 */
export function getWebUrl(): string {
  return getAppUrl("web");
}

/**
 * Get the creator portal URL (creator.ratecreator.com)
 */
export function getCreatorOpsUrl(): string {
  return getAppUrl("creatorops");
}

/**
 * Get the content app URL (content.ratecreator.com)
 */
export function getContentUrl(): string {
  return getAppUrl("content");
}

/**
 * Get the API URL
 */
export function getApiUrl(): string {
  const env = getEnvironment();
  return URL_CONFIGS[env].api;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvironment() === "production";
}

/**
 * Check if running locally
 */
export function isLocal(): boolean {
  return getEnvironment() === "local";
}

/**
 * Check if running in development (staging)
 */
export function isDevelopment(): boolean {
  return getEnvironment() === "development";
}

/**
 * Build a full URL for a path in a specific app
 */
export function buildUrl(app: AppType, path: string): string {
  const baseUrl = getAppUrl(app);
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Get content platform-specific base URL
 * Used when redirecting from content app to the appropriate platform
 */
export function getContentPlatformUrl(
  platform: "RATECREATOR" | "CREATOROPS" | "DOCUMENTATION",
): string {
  switch (platform) {
    case "RATECREATOR":
      return getWebUrl();
    case "CREATOROPS":
      return getCreatorOpsUrl();
    case "DOCUMENTATION":
      return `${getWebUrl()}/docs`;
    default:
      return getWebUrl();
  }
}

/**
 * Build a blog post URL for a specific platform
 */
export function buildBlogUrl(
  platform: "RATECREATOR" | "CREATOROPS" | "DOCUMENTATION",
  slug: string,
): string {
  const baseUrl = getContentPlatformUrl(platform);
  return `${baseUrl}/blog/${slug}`;
}

/**
 * Build a glossary URL
 */
export function buildGlossaryUrl(
  platform: "RATECREATOR" | "CREATOROPS",
  slug: string,
): string {
  const baseUrl = platform === "CREATOROPS" ? getCreatorOpsUrl() : getWebUrl();
  return `${baseUrl}/glossary/${slug}`;
}
