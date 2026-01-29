import { ContentPlatform, ContentType } from "@ratecreator/types/content";

/**
 * Returns the base domain for a given platform.
 * Single source of truth for platform → domain mapping.
 */
export const getPlatformDomain = (platform: ContentPlatform): string => {
  switch (platform) {
    case ContentPlatform.RATECREATOR:
      return "www.ratecreator.com";
    case ContentPlatform.CREATOROPS:
      return "www.creator.ratecreator.com";
    case ContentPlatform.UNITY:
      return "www.unity.ratecreator.com";
    case ContentPlatform.DOCUMENTATION:
      return "www.docs.ratecreator.com";
    default:
      return "www.ratecreator.com";
  }
};

const generateBaseUrl = (
  platform: ContentPlatform,
  contentType: ContentType,
): string => {
  return `${getPlatformDomain(platform)}/${contentType.toLowerCase()}`;
};

export default generateBaseUrl;
