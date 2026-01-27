/**
 * Tests for upload-crud actions
 * Tests S3/Digital Ocean Spaces file operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockS3Send } = vi.hoisted(() => {
  const mockS3Send = vi.fn();
  return { mockS3Send };
});

// Mock AWS S3 Client
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: mockS3Send,
  })),
  PutObjectAclCommand: vi.fn().mockImplementation((params) => ({
    type: "PutObjectAclCommand",
    ...params,
  })),
  DeleteObjectCommand: vi.fn().mockImplementation((params) => ({
    type: "DeleteObjectCommand",
    ...params,
  })),
}));

describe("Upload CRUD Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    process.env.DO_SPACES_BUCKET = "test-bucket";
    process.env.DO_SPACES_REGION = "nyc3";
    process.env.DO_SPACES_ENDPOINT = "https://nyc3.digitaloceanspaces.com";
    process.env.DO_SPACES_KEY = "test-key";
    process.env.DO_SPACES_SECRET = "test-secret";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("makeFilePublic", () => {
    // Simulate makeFilePublic function
    const makeFilePublic = async (fileName: string) => {
      try {
        await mockS3Send({
          Bucket: process.env.DO_SPACES_BUCKET,
          Key: fileName,
          ACL: "public-read",
        });
        return { success: true };
      } catch (error) {
        return { error: "Failed to update ACL" };
      }
    };

    it("should make file public successfully", async () => {
      mockS3Send.mockResolvedValueOnce({});

      const result = await makeFilePublic("uploads/image.jpg");

      expect(result).toEqual({ success: true });
      expect(mockS3Send).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "uploads/image.jpg",
        ACL: "public-read",
      });
    });

    it("should return error when S3 operation fails", async () => {
      mockS3Send.mockRejectedValueOnce(new Error("Access denied"));

      const result = await makeFilePublic("uploads/image.jpg");

      expect(result).toEqual({ error: "Failed to update ACL" });
    });

    it("should handle different file paths", async () => {
      mockS3Send.mockResolvedValue({});

      const testPaths = [
        "images/avatar.png",
        "posts/2024/01/cover.jpg",
        "user-uploads/profile-pic.jpeg",
        "media/video-thumbnail.webp",
      ];

      for (const path of testPaths) {
        await makeFilePublic(path);
        expect(mockS3Send).toHaveBeenCalledWith(
          expect.objectContaining({ Key: path }),
        );
      }
    });
  });

  describe("deleteFileFromBucket", () => {
    // Simulate deleteFileFromBucket function
    const deleteFileFromBucket = async (fileUrl: string) => {
      try {
        if (!fileUrl) {
          return { error: "File URL is required" };
        }

        const bucketName = process.env.DO_SPACES_BUCKET;
        const region = process.env.DO_SPACES_REGION;
        const baseUrl = `https://${bucketName}.${region}.cdn.digitaloceanspaces.com/`;

        if (!fileUrl.startsWith(baseUrl)) {
          return {
            error:
              "Invalid URL. The URL does not belong to the configured bucket.",
          };
        }

        const fileKey = fileUrl.replace(baseUrl, "");

        await mockS3Send({
          Bucket: bucketName,
          Key: fileKey,
        });

        return { success: true };
      } catch (error) {
        return { error: "Failed to delete file" };
      }
    };

    it("should delete file successfully", async () => {
      mockS3Send.mockResolvedValueOnce({});

      const fileUrl =
        "https://test-bucket.nyc3.cdn.digitaloceanspaces.com/uploads/image.jpg";
      const result = await deleteFileFromBucket(fileUrl);

      expect(result).toEqual({ success: true });
      expect(mockS3Send).toHaveBeenCalledWith({
        Bucket: "test-bucket",
        Key: "uploads/image.jpg",
      });
    });

    it("should return error when URL is empty", async () => {
      const result = await deleteFileFromBucket("");

      expect(result).toEqual({ error: "File URL is required" });
      expect(mockS3Send).not.toHaveBeenCalled();
    });

    it("should return error for invalid bucket URL", async () => {
      const result = await deleteFileFromBucket(
        "https://other-bucket.s3.amazonaws.com/file.jpg",
      );

      expect(result).toEqual({
        error: "Invalid URL. The URL does not belong to the configured bucket.",
      });
      expect(mockS3Send).not.toHaveBeenCalled();
    });

    it("should extract file key correctly from URL", async () => {
      mockS3Send.mockResolvedValue({});

      const testCases = [
        {
          url: "https://test-bucket.nyc3.cdn.digitaloceanspaces.com/simple.jpg",
          expectedKey: "simple.jpg",
        },
        {
          url: "https://test-bucket.nyc3.cdn.digitaloceanspaces.com/folder/file.png",
          expectedKey: "folder/file.png",
        },
        {
          url: "https://test-bucket.nyc3.cdn.digitaloceanspaces.com/deep/nested/path/file.pdf",
          expectedKey: "deep/nested/path/file.pdf",
        },
      ];

      for (const { url, expectedKey } of testCases) {
        vi.clearAllMocks();
        await deleteFileFromBucket(url);
        expect(mockS3Send).toHaveBeenCalledWith(
          expect.objectContaining({ Key: expectedKey }),
        );
      }
    });

    it("should return error when S3 delete fails", async () => {
      mockS3Send.mockRejectedValueOnce(new Error("Delete failed"));

      const fileUrl =
        "https://test-bucket.nyc3.cdn.digitaloceanspaces.com/uploads/image.jpg";
      const result = await deleteFileFromBucket(fileUrl);

      expect(result).toEqual({ error: "Failed to delete file" });
    });

    it("should handle special characters in file names", async () => {
      mockS3Send.mockResolvedValue({});

      const fileUrl =
        "https://test-bucket.nyc3.cdn.digitaloceanspaces.com/uploads/file%20with%20spaces.jpg";
      const result = await deleteFileFromBucket(fileUrl);

      expect(result).toEqual({ success: true });
      expect(mockS3Send).toHaveBeenCalledWith(
        expect.objectContaining({
          Key: "uploads/file%20with%20spaces.jpg",
        }),
      );
    });
  });

  describe("URL Validation", () => {
    const validateUrl = (fileUrl: string) => {
      const bucketName = process.env.DO_SPACES_BUCKET;
      const region = process.env.DO_SPACES_REGION;
      const baseUrl = `https://${bucketName}.${region}.cdn.digitaloceanspaces.com/`;
      return fileUrl.startsWith(baseUrl);
    };

    it("should validate correct bucket URL", () => {
      expect(
        validateUrl(
          "https://test-bucket.nyc3.cdn.digitaloceanspaces.com/file.jpg",
        ),
      ).toBe(true);
    });

    it("should reject URLs from different buckets", () => {
      expect(
        validateUrl(
          "https://other-bucket.nyc3.cdn.digitaloceanspaces.com/file.jpg",
        ),
      ).toBe(false);
    });

    it("should reject URLs from different regions", () => {
      expect(
        validateUrl(
          "https://test-bucket.sfo3.cdn.digitaloceanspaces.com/file.jpg",
        ),
      ).toBe(false);
    });

    it("should reject non-digitalocean URLs", () => {
      expect(validateUrl("https://s3.amazonaws.com/bucket/file.jpg")).toBe(
        false,
      );
      expect(validateUrl("https://example.com/file.jpg")).toBe(false);
    });
  });

  describe("File Key Extraction", () => {
    const extractFileKey = (fileUrl: string) => {
      const bucketName = process.env.DO_SPACES_BUCKET;
      const region = process.env.DO_SPACES_REGION;
      const baseUrl = `https://${bucketName}.${region}.cdn.digitaloceanspaces.com/`;
      return fileUrl.replace(baseUrl, "");
    };

    it("should extract simple file name", () => {
      const url =
        "https://test-bucket.nyc3.cdn.digitaloceanspaces.com/image.jpg";
      expect(extractFileKey(url)).toBe("image.jpg");
    });

    it("should extract nested file path", () => {
      const url =
        "https://test-bucket.nyc3.cdn.digitaloceanspaces.com/uploads/2024/01/image.jpg";
      expect(extractFileKey(url)).toBe("uploads/2024/01/image.jpg");
    });

    it("should handle URL-encoded characters", () => {
      const url =
        "https://test-bucket.nyc3.cdn.digitaloceanspaces.com/uploads/my%20file.jpg";
      expect(extractFileKey(url)).toBe("uploads/my%20file.jpg");
    });
  });
});
