/**
 * Clerk Authentication Mock
 * Provides mocked Clerk auth functions for testing
 */

import { vi } from "vitest";

export interface MockAuthResult {
  userId: string | null;
  sessionId: string | null;
  orgId?: string | null;
}

export interface MockClerkUser {
  id: string;
  firstName: string;
  lastName: string;
  emailAddresses: Array<{ emailAddress: string }>;
  username: string | null;
  imageUrl: string;
}

// Default mock auth result
let mockAuthResult: MockAuthResult = {
  userId: "clerk-user-123",
  sessionId: "session-123",
};

// Mock the auth function
export const mockAuth = vi.fn(() => Promise.resolve(mockAuthResult));

// Mock currentUser function
export const mockCurrentUser = vi.fn(() =>
  Promise.resolve<MockClerkUser | null>({
    id: "clerk-user-123",
    firstName: "John",
    lastName: "Doe",
    emailAddresses: [{ emailAddress: "john@example.com" }],
    username: "johndoe",
    imageUrl: "https://example.com/avatar.jpg",
  })
);

// Mock clerkClient
export const mockClerkClient = {
  users: {
    getUser: vi.fn(),
    getUserList: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
  organizations: {
    getOrganization: vi.fn(),
    getOrganizationList: vi.fn(),
    createOrganization: vi.fn(),
  },
};

// Helper functions to set up different auth states
export const setAuthenticatedUser = (userId: string, sessionId = "session-123") => {
  mockAuthResult = { userId, sessionId };
  mockAuth.mockResolvedValue(mockAuthResult);
};

export const setUnauthenticatedUser = () => {
  mockAuthResult = { userId: null, sessionId: null };
  mockAuth.mockResolvedValue(mockAuthResult);
};

export const setCurrentUser = (user: MockClerkUser | null) => {
  mockCurrentUser.mockResolvedValue(user);
};

// Reset all Clerk mocks
export const resetClerkMocks = () => {
  mockAuthResult = { userId: "clerk-user-123", sessionId: "session-123" };
  mockAuth.mockReset();
  mockAuth.mockResolvedValue(mockAuthResult);
  mockCurrentUser.mockReset();
  Object.values(mockClerkClient.users).forEach((fn) => fn.mockReset());
  Object.values(mockClerkClient.organizations).forEach((fn) => fn.mockReset());
};

// Module mock to be used with vi.mock
export const clerkMock = {
  auth: mockAuth,
  currentUser: mockCurrentUser,
  clerkClient: mockClerkClient,
};

export default clerkMock;
