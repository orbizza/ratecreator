import { describe, it, expect } from "vitest";
import { ContentPlatform, ContentType } from "@ratecreator/types/content";
import generateBaseUrl, { getPlatformDomain } from "../metadata-baseUrl";

describe("getPlatformDomain", () => {
  it("should return www.ratecreator.com for RATECREATOR", () => {
    expect(getPlatformDomain(ContentPlatform.RATECREATOR)).toBe(
      "www.ratecreator.com",
    );
  });

  it("should return www.creator.ratecreator.com for CREATOROPS", () => {
    expect(getPlatformDomain(ContentPlatform.CREATOROPS)).toBe(
      "www.creator.ratecreator.com",
    );
  });

  it("should return www.unity.ratecreator.com for UNITY", () => {
    expect(getPlatformDomain(ContentPlatform.UNITY)).toBe(
      "www.unity.ratecreator.com",
    );
  });

  it("should return www.docs.ratecreator.com for DOCUMENTATION", () => {
    expect(getPlatformDomain(ContentPlatform.DOCUMENTATION)).toBe(
      "www.docs.ratecreator.com",
    );
  });

  it("should fall back to www.ratecreator.com for unknown platform", () => {
    expect(getPlatformDomain("UNKNOWN" as ContentPlatform)).toBe(
      "www.ratecreator.com",
    );
  });
});

describe("generateBaseUrl", () => {
  describe("RATECREATOR platform", () => {
    it("should return ratecreator.com/blog for BLOG", () => {
      expect(
        generateBaseUrl(ContentPlatform.RATECREATOR, ContentType.BLOG),
      ).toBe("www.ratecreator.com/blog");
    });

    it("should return ratecreator.com/glossary for GLOSSARY", () => {
      expect(
        generateBaseUrl(ContentPlatform.RATECREATOR, ContentType.GLOSSARY),
      ).toBe("www.ratecreator.com/glossary");
    });

    it("should return ratecreator.com/newsletter for NEWSLETTER", () => {
      expect(
        generateBaseUrl(ContentPlatform.RATECREATOR, ContentType.NEWSLETTER),
      ).toBe("www.ratecreator.com/newsletter");
    });

    it("should return ratecreator.com/legal for LEGAL", () => {
      expect(
        generateBaseUrl(ContentPlatform.RATECREATOR, ContentType.LEGAL),
      ).toBe("www.ratecreator.com/legal");
    });
  });

  describe("CREATOROPS platform", () => {
    it("should return creator.ratecreator.com/blog for BLOG", () => {
      expect(
        generateBaseUrl(ContentPlatform.CREATOROPS, ContentType.BLOG),
      ).toBe("www.creator.ratecreator.com/blog");
    });

    it("should return creator.ratecreator.com/newsletter for NEWSLETTER", () => {
      expect(
        generateBaseUrl(ContentPlatform.CREATOROPS, ContentType.NEWSLETTER),
      ).toBe("www.creator.ratecreator.com/newsletter");
    });
  });

  describe("UNITY platform", () => {
    it("should return unity.ratecreator.com/blog for BLOG", () => {
      expect(generateBaseUrl(ContentPlatform.UNITY, ContentType.BLOG)).toBe(
        "www.unity.ratecreator.com/blog",
      );
    });

    it("should return unity.ratecreator.com/newsletter for NEWSLETTER", () => {
      expect(
        generateBaseUrl(ContentPlatform.UNITY, ContentType.NEWSLETTER),
      ).toBe("www.unity.ratecreator.com/newsletter");
    });
  });

  describe("DOCUMENTATION platform", () => {
    it("should return docs.ratecreator.com/glossary for GLOSSARY", () => {
      expect(
        generateBaseUrl(ContentPlatform.DOCUMENTATION, ContentType.GLOSSARY),
      ).toBe("www.docs.ratecreator.com/glossary");
    });

    it("should return docs.ratecreator.com/blog for BLOG", () => {
      expect(
        generateBaseUrl(ContentPlatform.DOCUMENTATION, ContentType.BLOG),
      ).toBe("www.docs.ratecreator.com/blog");
    });
  });

  describe("default/unknown platform", () => {
    it("should fall back to ratecreator.com for unknown platform", () => {
      expect(
        generateBaseUrl("UNKNOWN" as ContentPlatform, ContentType.BLOG),
      ).toBe("www.ratecreator.com/blog");
    });
  });
});
