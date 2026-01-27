/**
 * Tests for text-number-format utilities
 * Covers all 18 utility functions
 */

import { describe, it, expect } from "vitest";
import {
  formatValue,
  toSlug,
  fromSlug,
  formatDate,
  formatUtcTimestamp,
  getRedditPostId,
  extractTweetId,
  extractTikTokVideoId,
  removeNormalSuffix,
  convertToEmbeddedUrl,
  stripUrlParams,
  getInitials,
  truncateText,
  formatFloat,
  reverseAndHyphenate,
  capitalizeFirstLetter,
  capitalizeEachWord,
  splitAndCapitalize,
} from "../utils/text-number-format";

describe("formatValue", () => {
  describe("billion formatting", () => {
    it("should format 1 billion as 1.0 B", () => {
      expect(formatValue(1000000000)).toBe("1.0 B");
    });

    it("should format 1.5 billion as 1.5 B", () => {
      expect(formatValue(1500000000)).toBe("1.5 B");
    });

    it("should format 10 billion as 10.0 B", () => {
      expect(formatValue(10000000000)).toBe("10.0 B");
    });

    it("should format 999,999,999,999 as 1000.0 B", () => {
      expect(formatValue(999999999999)).toBe("1000.0 B");
    });
  });

  describe("million formatting", () => {
    it("should format 1 million as 1.0 M", () => {
      expect(formatValue(1000000)).toBe("1.0 M");
    });

    it("should format 1.5 million as 1.5 M", () => {
      expect(formatValue(1500000)).toBe("1.5 M");
    });

    it("should format 999 million as 999.0 M", () => {
      expect(formatValue(999000000)).toBe("999.0 M");
    });

    it("should format 100 million as 100.0 M", () => {
      expect(formatValue(100000000)).toBe("100.0 M");
    });
  });

  describe("thousand formatting", () => {
    it("should format 1000 as 1.0 K", () => {
      expect(formatValue(1000)).toBe("1.0 K");
    });

    it("should format 1500 as 1.5 K", () => {
      expect(formatValue(1500)).toBe("1.5 K");
    });

    it("should format 999999 as 1000.0 K", () => {
      expect(formatValue(999999)).toBe("1000.0 K");
    });

    it("should format 10000 as 10.0 K", () => {
      expect(formatValue(10000)).toBe("10.0 K");
    });

    it("should format 100000 as 100.0 K", () => {
      expect(formatValue(100000)).toBe("100.0 K");
    });
  });

  describe("small numbers", () => {
    it("should format 999 as 999", () => {
      expect(formatValue(999)).toBe("999");
    });

    it("should format 0 as 0", () => {
      expect(formatValue(0)).toBe("0");
    });

    it("should format 1 as 1", () => {
      expect(formatValue(1)).toBe("1");
    });

    it("should format 500 as 500", () => {
      expect(formatValue(500)).toBe("500");
    });
  });

  describe("edge cases", () => {
    it("should handle negative numbers", () => {
      expect(formatValue(-1000)).toBe("-1000");
    });

    it("should handle decimal numbers", () => {
      expect(formatValue(1000.5)).toBe("1.0 K");
    });
  });
});

describe("toSlug", () => {
  it("should convert text to lowercase", () => {
    expect(toSlug("Hello World")).toBe("hello-world");
  });

  it("should replace spaces with hyphens", () => {
    expect(toSlug("hello world")).toBe("hello-world");
  });

  it("should remove special characters", () => {
    expect(toSlug("Hello! World?")).toBe("hello-world");
  });

  it("should handle multiple spaces", () => {
    expect(toSlug("hello   world")).toBe("hello-world");
  });

  it("should handle multiple hyphens", () => {
    expect(toSlug("hello---world")).toBe("hello-world");
  });

  it("should convert leading and trailing spaces to hyphens (trim happens after space conversion)", () => {
    // Note: toSlug converts spaces to hyphens before trimming, so leading/trailing spaces become hyphens
    expect(toSlug("  hello world  ")).toBe("-hello-world-");
  });

  it("should handle empty string", () => {
    expect(toSlug("")).toBe("");
  });

  it("should handle single word", () => {
    expect(toSlug("Hello")).toBe("hello");
  });

  it("should handle numbers", () => {
    expect(toSlug("Hello 123 World")).toBe("hello-123-world");
  });

  it("should preserve underscores", () => {
    expect(toSlug("hello_world")).toBe("hello_world");
  });

  it("should handle unicode characters", () => {
    expect(toSlug("Café")).toBe("caf");
  });
});

describe("fromSlug", () => {
  it("should convert slug to readable text", () => {
    expect(fromSlug("hello-world")).toBe("Hello World");
  });

  it("should capitalize each word", () => {
    expect(fromSlug("this-is-a-test")).toBe("This Is A Test");
  });

  it("should handle single word", () => {
    expect(fromSlug("hello")).toBe("Hello");
  });

  it("should handle empty string", () => {
    expect(fromSlug("")).toBe("");
  });

  it("should handle multiple hyphens correctly", () => {
    expect(fromSlug("hello--world")).toBe("Hello  World");
  });
});

describe("formatDate", () => {
  it("should format ISO date string", () => {
    const result = formatDate("2024-01-15T12:00:00Z");
    expect(result).toContain("Jan");
    expect(result).toContain("15");
    expect(result).toContain("2024");
  });

  it("should format date without time", () => {
    const result = formatDate("2024-06-20");
    expect(result).toContain("Jun");
    expect(result).toContain("20");
    expect(result).toContain("2024");
  });

  it("should handle different months", () => {
    expect(formatDate("2024-12-25")).toContain("Dec");
    expect(formatDate("2024-03-01")).toContain("Mar");
    expect(formatDate("2024-07-04")).toContain("Jul");
  });
});

describe("formatUtcTimestamp", () => {
  it("should format Unix timestamp", () => {
    // January 1, 2024 00:00:00 UTC
    const timestamp = 1704067200;
    const result = formatUtcTimestamp(timestamp);
    expect(result).toContain("2024");
    expect(result).toContain("Jan");
  });

  it("should handle zero timestamp (epoch)", () => {
    const result = formatUtcTimestamp(0);
    expect(result).toContain("1970");
  });

  it("should handle large timestamps", () => {
    // Year 2030
    const timestamp = 1893456000;
    const result = formatUtcTimestamp(timestamp);
    expect(result).toContain("2030");
  });
});

describe("getRedditPostId", () => {
  it("should extract post ID from Reddit URL", () => {
    const url =
      "https://www.reddit.com/r/programming/comments/abc123/my_post_title";
    expect(getRedditPostId(url)).toBe(
      "r/programming/comments/abc123/my_post_title/",
    );
  });

  it("should return null for invalid Reddit URL", () => {
    expect(getRedditPostId("https://example.com")).toBe(null);
  });

  it("should return null for Reddit URL without comments", () => {
    expect(getRedditPostId("https://www.reddit.com/r/programming")).toBe(null);
  });

  it("should handle various subreddit names", () => {
    const url =
      "https://www.reddit.com/r/AskReddit/comments/xyz789/whats_your_story";
    expect(getRedditPostId(url)).toBe(
      "r/AskReddit/comments/xyz789/whats_your_story/",
    );
  });

  it("should handle post IDs with different lengths", () => {
    const url = "https://www.reddit.com/r/test/comments/a1b2c3d4/title";
    expect(getRedditPostId(url)).toBe("r/test/comments/a1b2c3d4/title/");
  });
});

describe("extractTweetId", () => {
  it("should extract tweet ID from Twitter URL", () => {
    const url = "https://twitter.com/user/status/1234567890123456789";
    expect(extractTweetId(url)).toBe("1234567890123456789");
  });

  it("should extract tweet ID from X.com URL", () => {
    const url = "https://x.com/user/status/9876543210123456789";
    expect(extractTweetId(url)).toBe("9876543210123456789");
  });

  it("should return null for invalid URL", () => {
    expect(extractTweetId("https://example.com")).toBe(null);
  });

  it("should return null for URL without status", () => {
    expect(extractTweetId("https://twitter.com/user")).toBe(null);
  });

  it("should handle URL with query parameters", () => {
    const url = "https://twitter.com/user/status/1234567890?ref=src";
    expect(extractTweetId(url)).toBe("1234567890");
  });
});

describe("extractTikTokVideoId", () => {
  it("should extract video ID from TikTok URL", () => {
    const url = "https://www.tiktok.com/@username/video/1234567890123456789";
    expect(extractTikTokVideoId(url)).toBe("1234567890123456789");
  });

  it("should return null for invalid TikTok URL", () => {
    expect(extractTikTokVideoId("https://example.com")).toBe(null);
  });

  it("should return null for TikTok URL without video", () => {
    expect(extractTikTokVideoId("https://www.tiktok.com/@username")).toBe(null);
  });

  it("should handle usernames with special characters", () => {
    const url =
      "https://www.tiktok.com/@user_name.123/video/9876543210123456789";
    expect(extractTikTokVideoId(url)).toBe("9876543210123456789");
  });
});

describe("removeNormalSuffix", () => {
  it("should remove _normal suffix from image URL", () => {
    expect(removeNormalSuffix("profile_normal.jpg")).toBe("profile.jpg");
  });

  it("should remove _normal suffix with png", () => {
    expect(removeNormalSuffix("avatar_normal.png")).toBe("avatar.png");
  });

  it("should not modify URL without _normal suffix", () => {
    expect(removeNormalSuffix("profile.jpg")).toBe("profile.jpg");
  });

  it("should handle _normal in middle of URL", () => {
    expect(removeNormalSuffix("path/profile_normal.jpg")).toBe(
      "path/profile.jpg",
    );
  });

  it("should only remove suffix at end of URL", () => {
    expect(removeNormalSuffix("normal_user_normal.jpg")).toBe(
      "normal_user.jpg",
    );
  });
});

describe("convertToEmbeddedUrl", () => {
  it("should convert watch URL to embed URL", () => {
    expect(convertToEmbeddedUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });

  it("should handle URL with additional parameters", () => {
    expect(
      convertToEmbeddedUrl("https://www.youtube.com/watch?v=abc123&t=100"),
    ).toBe("https://www.youtube.com/embed/abc123&t=100");
  });

  it("should not modify already embedded URL", () => {
    expect(convertToEmbeddedUrl("https://www.youtube.com/embed/abc123")).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });
});

describe("stripUrlParams", () => {
  it("should strip parameters after .png", () => {
    expect(stripUrlParams("https://example.com/image.png?v=123")).toBe(
      "https://example.com/image.png",
    );
  });

  it("should return URL as-is if no .png", () => {
    expect(stripUrlParams("https://example.com/image.jpg?v=123")).toBe(
      "https://example.com/image.jpg?v=123",
    );
  });

  it("should return empty string for falsy input", () => {
    expect(stripUrlParams("")).toBe("");
  });

  it("should handle URL with only .png extension", () => {
    expect(stripUrlParams("https://example.com/image.png")).toBe(
      "https://example.com/image.png",
    );
  });

  it("should handle URL with multiple .png occurrences", () => {
    expect(stripUrlParams("https://example.com/png/image.png?v=1")).toBe(
      "https://example.com/png/image.png",
    );
  });
});

describe("getInitials", () => {
  it("should return initials from full name", () => {
    expect(getInitials("John Doe")).toBe("JD");
  });

  it("should return initials from multi-word name", () => {
    expect(getInitials("John Michael Doe")).toBe("JD");
  });

  it("should return single letter for single word", () => {
    expect(getInitials("John")).toBe("J");
  });

  it("should return default for empty string", () => {
    expect(getInitials("")).toBe("SD");
  });

  it("should handle lowercase names", () => {
    expect(getInitials("john doe")).toBe("JD");
  });

  it("should handle email addresses", () => {
    expect(getInitials("john@example.com")).toBe("J");
  });
});

describe("truncateText", () => {
  it("should truncate text longer than maxLength", () => {
    expect(truncateText("Hello World!", 8)).toBe("Hello...");
  });

  it("should not truncate text shorter than maxLength", () => {
    expect(truncateText("Hello", 10)).toBe("Hello");
  });

  it("should handle exact length", () => {
    expect(truncateText("Hello", 5)).toBe("Hello");
  });

  it("should return empty string for null/undefined", () => {
    expect(truncateText("", 10)).toBe("");
  });

  it("should handle maxLength of 3 (minimum for ellipsis)", () => {
    expect(truncateText("Hello", 3)).toBe("...");
  });

  it("should handle very long text", () => {
    const longText = "a".repeat(1000);
    expect(truncateText(longText, 100)).toBe("a".repeat(97) + "...");
  });
});

describe("formatFloat", () => {
  it("should format integer to 2 decimal places", () => {
    expect(formatFloat(5)).toBe("5.00");
  });

  it("should format float to 2 decimal places", () => {
    expect(formatFloat(5.123)).toBe("5.12");
  });

  it("should round up when needed", () => {
    expect(formatFloat(5.126)).toBe("5.13");
  });

  it("should handle zero", () => {
    expect(formatFloat(0)).toBe("0.00");
  });

  it("should handle negative numbers", () => {
    expect(formatFloat(-3.14159)).toBe("-3.14");
  });

  it("should handle very small numbers", () => {
    expect(formatFloat(0.001)).toBe("0.00");
  });
});

describe("reverseAndHyphenate", () => {
  it("should convert spaces to hyphens and lowercase", () => {
    expect(reverseAndHyphenate("Hello World")).toBe("hello-world");
  });

  it("should convert spaces to hyphens including leading/trailing (trim happens after hyphenation)", () => {
    // Note: reverseAndHyphenate converts spaces to hyphens before trimming, so leading/trailing spaces become hyphens
    expect(reverseAndHyphenate("  hello world  ")).toBe("--hello-world--");
  });

  it("should handle single word", () => {
    expect(reverseAndHyphenate("Hello")).toBe("hello");
  });

  it("should handle multiple spaces", () => {
    expect(reverseAndHyphenate("hello   world")).toBe("hello---world");
  });
});

describe("capitalizeFirstLetter", () => {
  it("should capitalize first word from hyphenated string", () => {
    expect(capitalizeFirstLetter("hello-world")).toBe("Hello world");
  });

  it("should handle single word", () => {
    expect(capitalizeFirstLetter("hello")).toBe("Hello");
  });

  it("should lowercase subsequent words", () => {
    expect(capitalizeFirstLetter("HELLO-WORLD")).toBe("Hello world");
  });

  it("should handle multiple hyphens", () => {
    expect(capitalizeFirstLetter("hello-beautiful-world")).toBe(
      "Hello beautiful world",
    );
  });
});

describe("capitalizeEachWord", () => {
  it("should capitalize each word from hyphenated string", () => {
    expect(capitalizeEachWord("hello-world")).toBe("Hello World");
  });

  it("should handle single word", () => {
    expect(capitalizeEachWord("hello")).toBe("Hello");
  });

  it("should capitalize all words regardless of case", () => {
    expect(capitalizeEachWord("HELLO-WORLD")).toBe("Hello World");
  });

  it("should handle multiple words", () => {
    expect(capitalizeEachWord("this-is-a-test")).toBe("This Is A Test");
  });
});

describe("splitAndCapitalize", () => {
  it("should return first word in uppercase", () => {
    expect(splitAndCapitalize("hello-world")).toBe("HELLO");
  });

  it("should handle single word", () => {
    expect(splitAndCapitalize("hello")).toBe("HELLO");
  });

  it("should only return first part", () => {
    expect(splitAndCapitalize("one-two-three")).toBe("ONE");
  });

  it("should handle already uppercase", () => {
    expect(splitAndCapitalize("HELLO-world")).toBe("HELLO");
  });
});
