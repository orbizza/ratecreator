import { ContentPlatform, ContentType } from "@ratecreator/types/content";

const generateBaseUrl = (
  platform: ContentPlatform,
  contentType: ContentType,
): string => {
  let baseUrl: string;

  switch (platform) {
    case ContentPlatform.RATECREATOR:
      if (contentType === ContentType.LEGAL) {
        baseUrl = "www.legal.ratecreator.com";
      } else {
        baseUrl = "www.ratecreator.com";
      }
      break;
    case ContentPlatform.CREATOROPS:
      baseUrl = "www.creator.ratecreator.com";
      break;
    case ContentPlatform.UNITY:
      baseUrl = "www.unity.ratecreator.com";
      break;
    case ContentPlatform.DOCUMENTATION:
      baseUrl = "www.docs.ratecreator.com";
      break;
    default:
      baseUrl = "www.ratecreator.com";
  }

  return `${baseUrl}/${contentType.toLowerCase()}`;
};

export default generateBaseUrl;
