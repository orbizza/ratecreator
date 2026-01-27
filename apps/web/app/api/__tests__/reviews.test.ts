/**
 * Tests for Reviews API Route
 * Tests review creation with authentication
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockAuth, mockCreateReview } = vi.hoisted(() => {
  const mockAuth = vi.fn();
  const mockCreateReview = vi.fn();
  return { mockAuth, mockCreateReview };
});

// Mock modules
vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@ratecreator/actions/review", () => ({
  createReview: mockCreateReview,
}));

import { POST } from "../reviews/route";

describe("Reviews API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createRequest = (body: Record<string, any>) => {
    return new Request("http://localhost:3000/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      mockAuth.mockReturnValueOnce({ userId: null });

      const request = createRequest({ accountId: "123", rating: 5 });
      const response = await POST(request);

      expect(response.status).toBe(401);
      const text = await response.text();
      expect(text).toBe("Unauthorized");
    });

    it("should proceed when user is authenticated", async () => {
      mockAuth.mockReturnValueOnce({ userId: "user-123" });
      mockCreateReview.mockResolvedValueOnce({
        success: true,
        data: { id: "review-1" },
      });

      const request = createRequest({
        accountId: "account-123",
        rating: 5,
        content: "Great content!",
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Successful Review Creation", () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: "user-123" });
    });

    it("should create a review with valid data", async () => {
      const reviewData = {
        accountId: "account-123",
        rating: 5,
        content: "This is an excellent channel!",
        title: "Great Content",
      };

      const createdReview = {
        id: "review-1",
        ...reviewData,
        userId: "user-123",
        createdAt: new Date().toISOString(),
      };

      mockCreateReview.mockResolvedValueOnce({
        success: true,
        data: createdReview,
      });

      const request = createRequest(reviewData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("review-1");
      expect(mockCreateReview).toHaveBeenCalledWith(reviewData);
    });

    it("should pass all review fields to createReview", async () => {
      const fullReviewData = {
        accountId: "account-456",
        rating: 4,
        content: "Very informative content",
        title: "Solid Channel",
        platform: "YOUTUBE",
      };

      mockCreateReview.mockResolvedValueOnce({
        success: true,
        data: { id: "review-2", ...fullReviewData },
      });

      const request = createRequest(fullReviewData);
      await POST(request);

      expect(mockCreateReview).toHaveBeenCalledWith(fullReviewData);
    });

    it("should return the created review data", async () => {
      const reviewData = {
        accountId: "account-789",
        rating: 3,
        content: "Average content",
      };

      const createdReview = {
        id: "review-3",
        ...reviewData,
        userId: "user-123",
        status: "PUBLISHED",
        upvotes: 0,
        downvotes: 0,
      };

      mockCreateReview.mockResolvedValueOnce({
        success: true,
        data: createdReview,
      });

      const request = createRequest(reviewData);
      const response = await POST(request);
      const data = await response.json();

      expect(data.id).toBe("review-3");
      expect(data.status).toBe("PUBLISHED");
    });
  });

  describe("Review Creation Failure", () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: "user-123" });
    });

    it("should return 400 when createReview returns error", async () => {
      mockCreateReview.mockResolvedValueOnce({
        success: false,
        error: "Invalid rating value",
      });

      const request = createRequest({
        accountId: "account-123",
        rating: 10, // Invalid rating
        content: "Content",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const text = await response.text();
      expect(text).toBe("Invalid rating value");
    });

    it("should return 400 for missing required fields", async () => {
      mockCreateReview.mockResolvedValueOnce({
        success: false,
        error: "Account ID is required",
      });

      const request = createRequest({
        rating: 5,
        content: "Content",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should return 400 for invalid content", async () => {
      mockCreateReview.mockResolvedValueOnce({
        success: false,
        error: "Content is too short",
      });

      const request = createRequest({
        accountId: "account-123",
        rating: 5,
        content: "",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: "user-123" });
    });

    it("should return 500 on internal error", async () => {
      mockCreateReview.mockRejectedValueOnce(new Error("Database error"));

      const request = createRequest({
        accountId: "account-123",
        rating: 5,
        content: "Great!",
      });
      const response = await POST(request);

      expect(response.status).toBe(500);
      const text = await response.text();
      expect(text).toBe("Internal error");
    });

    it("should handle JSON parsing errors", async () => {
      const request = new Request("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: "invalid json",
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it("should handle empty request body", async () => {
      const request = new Request("http://localhost:3000/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      mockCreateReview.mockResolvedValueOnce({
        success: false,
        error: "Missing required fields",
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe("Rating Validation", () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: "user-123" });
    });

    it("should accept rating of 1", async () => {
      mockCreateReview.mockResolvedValueOnce({
        success: true,
        data: { id: "review-1", rating: 1 },
      });

      const request = createRequest({
        accountId: "account-123",
        rating: 1,
        content: "Not great",
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("should accept rating of 5", async () => {
      mockCreateReview.mockResolvedValueOnce({
        success: true,
        data: { id: "review-2", rating: 5 },
      });

      const request = createRequest({
        accountId: "account-123",
        rating: 5,
        content: "Excellent!",
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("should accept decimal ratings", async () => {
      mockCreateReview.mockResolvedValueOnce({
        success: true,
        data: { id: "review-3", rating: 4.5 },
      });

      const request = createRequest({
        accountId: "account-123",
        rating: 4.5,
        content: "Almost perfect",
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Content Handling", () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: "user-123" });
    });

    it("should handle rich text content", async () => {
      const richContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "This is formatted content" }],
          },
        ],
      };

      mockCreateReview.mockResolvedValueOnce({
        success: true,
        data: { id: "review-4", content: richContent },
      });

      const request = createRequest({
        accountId: "account-123",
        rating: 4,
        content: richContent,
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("should handle very long content", async () => {
      const longContent = "A".repeat(10000);

      mockCreateReview.mockResolvedValueOnce({
        success: true,
        data: { id: "review-5", content: longContent },
      });

      const request = createRequest({
        accountId: "account-123",
        rating: 4,
        content: longContent,
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("should handle content with special characters", async () => {
      const specialContent =
        "Great channel! <script>alert('xss')</script> & more";

      mockCreateReview.mockResolvedValueOnce({
        success: true,
        data: { id: "review-6", content: specialContent },
      });

      const request = createRequest({
        accountId: "account-123",
        rating: 4,
        content: specialContent,
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it("should handle unicode content", async () => {
      const unicodeContent = "Great channel! 🎉 很好 こんにちは";

      mockCreateReview.mockResolvedValueOnce({
        success: true,
        data: { id: "review-7", content: unicodeContent },
      });

      const request = createRequest({
        accountId: "account-123",
        rating: 5,
        content: unicodeContent,
      });
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });
});
