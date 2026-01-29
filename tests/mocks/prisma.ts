/**
 * Prisma Client Mock
 * Provides a fully mocked Prisma client for testing
 */

import { vi } from "vitest";

// Create mock functions for all common Prisma operations
const createMockModel = () => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  createMany: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
  upsert: vi.fn(),
  count: vi.fn(),
  aggregate: vi.fn(),
  groupBy: vi.fn(),
});

export const mockPrismaClient = {
  user: createMockModel(),
  account: createMockModel(),
  review: createMockModel(),
  comment: createMockModel(),
  vote: createMockModel(),
  commentVote: createMockModel(),
  category: createMockModel(),
  categoryMapping: createMockModel(),
  claimedAccount: createMockModel(),
  userLinkedAccount: createMockModel(),
  organization: createMockModel(),
  organizationMember: createMockModel(),
  organizationAccount: createMockModel(),
  dataRefreshLog: createMockModel(),
  saveToMyList: createMockModel(),
  newsletter: createMockModel(),
  newsletterAudience: createMockModel(),
  youTubeVideo: createMockModel(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $transaction: vi.fn((callback: (tx: typeof mockPrismaClient) => Promise<unknown>) =>
    callback(mockPrismaClient)
  ),
  $queryRaw: vi.fn(),
  $executeRaw: vi.fn(),
};

export const createPrismaMock = () => mockPrismaClient;

// Helper to reset all mocks
export const resetPrismaMocks = () => {
  Object.values(mockPrismaClient).forEach((model) => {
    if (typeof model === "object" && model !== null) {
      Object.values(model).forEach((method) => {
        if (typeof method === "function" && "mockReset" in method) {
          (method as ReturnType<typeof vi.fn>).mockReset();
        }
      });
    }
  });
};

// Helper to setup common mock responses
export const setupPrismaMockResponses = {
  userExists: (user: Record<string, unknown>) => {
    mockPrismaClient.user.findUnique.mockResolvedValue(user);
    mockPrismaClient.user.findFirst.mockResolvedValue(user);
  },
  userNotExists: () => {
    mockPrismaClient.user.findUnique.mockResolvedValue(null);
    mockPrismaClient.user.findFirst.mockResolvedValue(null);
  },
  accountExists: (account: Record<string, unknown>) => {
    mockPrismaClient.account.findUnique.mockResolvedValue(account);
    mockPrismaClient.account.findFirst.mockResolvedValue(account);
  },
  accountNotExists: () => {
    mockPrismaClient.account.findUnique.mockResolvedValue(null);
    mockPrismaClient.account.findFirst.mockResolvedValue(null);
  },
  reviewCreated: (review: Record<string, unknown>) => {
    mockPrismaClient.review.create.mockResolvedValue(review);
  },
  reviewsFound: (reviews: Record<string, unknown>[]) => {
    mockPrismaClient.review.findMany.mockResolvedValue(reviews);
  },
};

export default mockPrismaClient;
