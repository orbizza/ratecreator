/**
 * Tests for Clerk webhook route
 * Verifies Svix signature validation, payload checks, and Pub/Sub publishing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";

// Use vi.hoisted for mocks so they are available before module imports
const { mockVerify, MockWebhook, mockPublishMessageWithKey } = vi.hoisted(
  () => {
    const mockVerify = vi.fn();
    const MockWebhook = vi.fn(() => ({
      verify: mockVerify,
    }));
    const mockPublishMessageWithKey = vi.fn();

    return { mockVerify, MockWebhook, mockPublishMessageWithKey };
  },
);

// Mock svix module
vi.mock("svix", () => ({
  Webhook: MockWebhook,
}));

// Mock Pub/Sub client
vi.mock("@ratecreator/db/pubsub-client", () => ({
  publishMessageWithKey: mockPublishMessageWithKey,
}));

// Helper to build valid webhook requests
function buildRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Request {
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "svix-id": "msg_test123",
    "svix-timestamp": "1234567890",
    "svix-signature": "v1,abc123signature",
    ...headers,
  };

  return new Request("http://localhost/clerk-webhook", {
    method: "POST",
    headers: defaultHeaders,
    body: JSON.stringify(body),
  });
}

const VALID_PAYLOAD = {
  type: "user.created",
  data: {
    id: "user_abc123",
    email_addresses: [{ email_address: "test@example.com" }],
    first_name: "Test",
    last_name: "User",
  },
};

describe("Clerk Webhook Route", () => {
  let app: Hono;
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    process.env = { ...originalEnv };
    process.env.CLERK_WEBHOOK_SECRET = "whsec_test_secret_key";

    const { clerkWebhookRoute } = await import("../routes/clerk-webhook");
    app = new Hono();
    app.route("/clerk-webhook", clerkWebhookRoute);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should return 500 when CLERK_WEBHOOK_SECRET is not set", async () => {
    delete process.env.CLERK_WEBHOOK_SECRET;

    const req = buildRequest(VALID_PAYLOAD);
    const res = await app.request(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Webhook secret not configured");
  });

  it("should return 400 when svix-id header is missing", async () => {
    const req = buildRequest(VALID_PAYLOAD, {
      "svix-id": "",
    });
    // Remove the header entirely by building a custom request
    const headers = new Headers({
      "Content-Type": "application/json",
      "svix-timestamp": "1234567890",
      "svix-signature": "v1,abc123signature",
    });
    const customReq = new Request("http://localhost/clerk-webhook", {
      method: "POST",
      headers,
      body: JSON.stringify(VALID_PAYLOAD),
    });

    const res = await app.request(customReq);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Missing Svix headers");
  });

  it("should return 400 when svix-timestamp header is missing", async () => {
    const headers = new Headers({
      "Content-Type": "application/json",
      "svix-id": "msg_test123",
      "svix-signature": "v1,abc123signature",
    });
    const req = new Request("http://localhost/clerk-webhook", {
      method: "POST",
      headers,
      body: JSON.stringify(VALID_PAYLOAD),
    });

    const res = await app.request(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Missing Svix headers");
  });

  it("should return 400 when svix-signature header is missing", async () => {
    const headers = new Headers({
      "Content-Type": "application/json",
      "svix-id": "msg_test123",
      "svix-timestamp": "1234567890",
    });
    const req = new Request("http://localhost/clerk-webhook", {
      method: "POST",
      headers,
      body: JSON.stringify(VALID_PAYLOAD),
    });

    const res = await app.request(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Missing Svix headers");
  });

  it("should return 400 when signature verification fails", async () => {
    mockVerify.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const req = buildRequest(VALID_PAYLOAD);
    const res = await app.request(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Webhook verification failed");
  });

  it("should return 400 when payload is missing type", async () => {
    mockVerify.mockReturnValue(undefined);

    const payloadWithoutType = {
      data: { id: "user_abc123" },
    };

    const req = buildRequest(payloadWithoutType);
    const res = await app.request(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid payload: Missing required fields");
  });

  it("should return 400 when payload is missing data.id", async () => {
    mockVerify.mockReturnValue(undefined);

    const payloadWithoutDataId = {
      type: "user.created",
      data: { email: "test@example.com" },
    };

    const req = buildRequest(payloadWithoutDataId);
    const res = await app.request(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid payload: Missing required fields");
  });

  it("should return 400 when payload has no data at all", async () => {
    mockVerify.mockReturnValue(undefined);

    const payloadWithoutData = {
      type: "user.created",
    };

    const req = buildRequest(payloadWithoutData);
    const res = await app.request(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid payload: Missing required fields");
  });

  it("should process valid webhook and publish to Pub/Sub", async () => {
    mockVerify.mockReturnValue(undefined);
    mockPublishMessageWithKey.mockResolvedValue("msg-id-123");

    const req = buildRequest(VALID_PAYLOAD);
    const res = await app.request(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toBe("Webhook processed successfully");

    // Verify Pub/Sub was called with correct args
    expect(mockPublishMessageWithKey).toHaveBeenCalledOnce();
    expect(mockPublishMessageWithKey).toHaveBeenCalledWith(
      "clerk-user-events",
      "user.created:user_abc123",
      VALID_PAYLOAD.data,
    );
  });

  it("should use correct topic and message key format", async () => {
    mockVerify.mockReturnValue(undefined);
    mockPublishMessageWithKey.mockResolvedValue("msg-id-456");

    const payload = {
      type: "user.updated",
      data: {
        id: "user_xyz789",
        first_name: "Updated",
      },
    };

    const req = buildRequest(payload);
    const res = await app.request(req);

    expect(res.status).toBe(200);

    expect(mockPublishMessageWithKey).toHaveBeenCalledWith(
      "clerk-user-events",
      "user.updated:user_xyz789",
      payload.data,
    );
  });

  it("should return 500 when Pub/Sub publish fails", async () => {
    mockVerify.mockReturnValue(undefined);
    mockPublishMessageWithKey.mockRejectedValue(
      new Error("Pub/Sub connection failed"),
    );

    const req = buildRequest(VALID_PAYLOAD);
    const res = await app.request(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });

  it("should create Webhook instance with the secret from env", async () => {
    mockVerify.mockReturnValue(undefined);
    mockPublishMessageWithKey.mockResolvedValue("msg-id");

    const req = buildRequest(VALID_PAYLOAD);
    await app.request(req);

    expect(MockWebhook).toHaveBeenCalledWith("whsec_test_secret_key");
  });

  it("should pass correct headers to Svix verify", async () => {
    mockVerify.mockReturnValue(undefined);
    mockPublishMessageWithKey.mockResolvedValue("msg-id");

    const req = buildRequest(VALID_PAYLOAD);
    await app.request(req);

    expect(mockVerify).toHaveBeenCalledWith(JSON.stringify(VALID_PAYLOAD), {
      "svix-id": "msg_test123",
      "svix-timestamp": "1234567890",
      "svix-signature": "v1,abc123signature",
    });
  });
});
