/**
 * Global test setup for Vitest
 * This file is loaded before all tests
 */

import { vi, beforeAll, afterAll, afterEach } from "vitest";

// Mock environment variables
process.env.DATABASE_URL_ONLINE = "mongodb://localhost:27017/test";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";
process.env.REDIS_USERNAME = "test";
process.env.REDIS_PASSWORD = "test";
process.env.KAFKA_SERVICE_URI = "localhost:9092";
process.env.ALGOLIA_APP_ID = "test-app-id";
process.env.ALGOLIA_WRITE_API_KEY = "test-api-key";
process.env.ELASTIC_CLOUD_ID = "test-cloud-id";
process.env.ELASTIC_API_KEY = "test-api-key";
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "test-publishable-key";
process.env.CLERK_SECRET_KEY = "test-secret-key";
process.env.DO_SPACES_ENDPOINT = "https://test.digitaloceanspaces.com";
process.env.DO_SPACES_BUCKET = "test-bucket";
process.env.DO_SPACES_KEY = "test-key";
process.env.DO_SPACES_SECRET = "test-secret";

// Global mocks
beforeAll(() => {
  // Suppress console errors during tests unless explicitly needed
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks();
});

afterAll(() => {
  // Restore all mocks after all tests
  vi.restoreAllMocks();
});

// Global test utilities
declare global {
  // eslint-disable-next-line no-var
  var testUtils: {
    createMockUser: (overrides?: Partial<MockUser>) => MockUser;
    createMockAccount: (overrides?: Partial<MockAccount>) => MockAccount;
    createMockReview: (overrides?: Partial<MockReview>) => MockReview;
  };
}

interface MockUser {
  id: string;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MockAccount {
  id: string;
  name: string;
  handle: string;
  accountId: string;
  platform: string;
  followerCount: number;
  imageUrl: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MockReview {
  id: string;
  title: string;
  content: string;
  stars: number;
  authorId: string;
  accountId: string;
  platform: string;
  status: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

globalThis.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: "user-123",
    clerkId: "clerk-123",
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    username: "johndoe",
    isDeleted: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  }),

  createMockAccount: (overrides = {}) => ({
    id: "account-123",
    name: "Test Creator",
    handle: "testcreator",
    accountId: "UC123456",
    platform: "YOUTUBE",
    followerCount: 100000,
    imageUrl: "https://example.com/image.jpg",
    isDeleted: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  }),

  createMockReview: (overrides = {}) => ({
    id: "review-123",
    title: "Great Creator",
    content: "This creator makes amazing content!",
    stars: 5,
    authorId: "user-123",
    accountId: "account-123",
    platform: "youtube",
    status: "PUBLISHED",
    isDeleted: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  }),
};
