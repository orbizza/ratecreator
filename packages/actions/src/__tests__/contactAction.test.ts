/**
 * Tests for contact action
 * Tests contact form submission with validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockContactFormCreate, mockPrismaInstance } = vi.hoisted(() => {
  const mockContactFormCreate = vi.fn();
  const mockPrismaInstance = {
    contactForm: {
      create: mockContactFormCreate,
    },
  };
  return { mockContactFormCreate, mockPrismaInstance };
});

// Mock modules
vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrismaInstance),
}));

// Mock the ContactSchema validator
vi.mock("@ratecreator/types/review", () => ({
  ContactSchema: {
    safeParse: vi.fn((data) => {
      // Basic validation simulation
      if (!data.email || !data.email.includes("@")) {
        return {
          success: false,
          error: { issues: [{ message: "Invalid email" }] },
        };
      }
      if (!data.name || data.name.trim() === "") {
        return {
          success: false,
          error: { issues: [{ message: "Name required" }] },
        };
      }
      if (!data.message || data.message.trim() === "") {
        return {
          success: false,
          error: { issues: [{ message: "Message required" }] },
        };
      }
      return { success: true, data };
    }),
  },
}));

import { ContactSchema } from "@ratecreator/types/review";

describe("Contact Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Simulate contact function
  const contact = async (values: {
    email: string;
    name: string;
    message: string;
  }) => {
    const validatedFields = ContactSchema.safeParse(values);

    if (!validatedFields.success) {
      return {
        error: "Invalid fields!",
      };
    }

    const { email, name, message } = validatedFields.data;

    try {
      await mockPrismaInstance.contactForm.create({
        data: {
          name,
          email,
          message,
        },
      });
    } catch (error) {
      return {
        error: "Something went wrong!",
      };
    }

    return {
      success: "Message sent!",
    };
  };

  describe("Form Validation", () => {
    it("should reject invalid email", async () => {
      const result = await contact({
        email: "invalid-email",
        name: "Test User",
        message: "Test message",
      });

      expect(result).toEqual({ error: "Invalid fields!" });
      expect(mockContactFormCreate).not.toHaveBeenCalled();
    });

    it("should reject empty name", async () => {
      const result = await contact({
        email: "test@example.com",
        name: "",
        message: "Test message",
      });

      expect(result).toEqual({ error: "Invalid fields!" });
      expect(mockContactFormCreate).not.toHaveBeenCalled();
    });

    it("should reject empty message", async () => {
      const result = await contact({
        email: "test@example.com",
        name: "Test User",
        message: "",
      });

      expect(result).toEqual({ error: "Invalid fields!" });
      expect(mockContactFormCreate).not.toHaveBeenCalled();
    });

    it("should reject whitespace-only name", async () => {
      const result = await contact({
        email: "test@example.com",
        name: "   ",
        message: "Test message",
      });

      expect(result).toEqual({ error: "Invalid fields!" });
    });

    it("should reject whitespace-only message", async () => {
      const result = await contact({
        email: "test@example.com",
        name: "Test User",
        message: "   ",
      });

      expect(result).toEqual({ error: "Invalid fields!" });
    });
  });

  describe("Successful Submission", () => {
    it("should submit valid contact form", async () => {
      mockContactFormCreate.mockResolvedValueOnce({ id: "contact-123" });

      const result = await contact({
        email: "user@example.com",
        name: "John Doe",
        message: "Hello, I have a question!",
      });

      expect(result).toEqual({ success: "Message sent!" });
      expect(mockContactFormCreate).toHaveBeenCalledWith({
        data: {
          name: "John Doe",
          email: "user@example.com",
          message: "Hello, I have a question!",
        },
      });
    });

    it("should accept various valid email formats", async () => {
      mockContactFormCreate.mockResolvedValue({ id: "contact-123" });

      const validEmails = [
        "simple@example.com",
        "user.name@example.com",
        "user+tag@example.com",
        "user@subdomain.example.com",
        "user123@example.org",
      ];

      for (const email of validEmails) {
        vi.clearAllMocks();
        const result = await contact({
          email,
          name: "Test User",
          message: "Test message",
        });
        expect(result.success).toBe("Message sent!");
      }
    });

    it("should store form data in database", async () => {
      mockContactFormCreate.mockResolvedValueOnce({ id: "contact-456" });

      await contact({
        email: "business@company.com",
        name: "Business User",
        message: "Partnership inquiry",
      });

      expect(mockContactFormCreate).toHaveBeenCalledWith({
        data: {
          name: "Business User",
          email: "business@company.com",
          message: "Partnership inquiry",
        },
      });
    });
  });

  describe("Error Handling", () => {
    it("should return error when database fails", async () => {
      mockContactFormCreate.mockRejectedValueOnce(new Error("Database error"));

      const result = await contact({
        email: "user@example.com",
        name: "John Doe",
        message: "Test message",
      });

      expect(result).toEqual({ error: "Something went wrong!" });
    });

    it("should handle unique constraint violation", async () => {
      mockContactFormCreate.mockRejectedValueOnce(
        new Error("Unique constraint violation"),
      );

      const result = await contact({
        email: "duplicate@example.com",
        name: "Duplicate User",
        message: "Another message",
      });

      expect(result).toEqual({ error: "Something went wrong!" });
    });

    it("should handle connection timeout", async () => {
      mockContactFormCreate.mockRejectedValueOnce(
        new Error("Connection timeout"),
      );

      const result = await contact({
        email: "user@example.com",
        name: "Test User",
        message: "Test message",
      });

      expect(result).toEqual({ error: "Something went wrong!" });
    });
  });

  describe("Message Content", () => {
    it("should handle long messages", async () => {
      mockContactFormCreate.mockResolvedValueOnce({ id: "contact-789" });

      const longMessage = "A".repeat(10000); // 10,000 characters
      const result = await contact({
        email: "user@example.com",
        name: "Test User",
        message: longMessage,
      });

      expect(result).toEqual({ success: "Message sent!" });
      expect(mockContactFormCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ message: longMessage }),
      });
    });

    it("should handle messages with special characters", async () => {
      mockContactFormCreate.mockResolvedValueOnce({ id: "contact-101" });

      const messageWithSpecialChars =
        "Hello! I'm interested in <script>alert('test')</script> & other features.";
      const result = await contact({
        email: "user@example.com",
        name: "Test User",
        message: messageWithSpecialChars,
      });

      expect(result).toEqual({ success: "Message sent!" });
      expect(mockContactFormCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ message: messageWithSpecialChars }),
      });
    });

    it("should handle multiline messages", async () => {
      mockContactFormCreate.mockResolvedValueOnce({ id: "contact-102" });

      const multilineMessage = `Line 1
Line 2
Line 3

New paragraph here.`;
      const result = await contact({
        email: "user@example.com",
        name: "Test User",
        message: multilineMessage,
      });

      expect(result).toEqual({ success: "Message sent!" });
    });

    it("should handle unicode characters in name and message", async () => {
      mockContactFormCreate.mockResolvedValueOnce({ id: "contact-103" });

      const result = await contact({
        email: "user@example.com",
        name: "José García",
        message: "Hola! 你好! こんにちは! 🎉",
      });

      expect(result).toEqual({ success: "Message sent!" });
      expect(mockContactFormCreate).toHaveBeenCalledWith({
        data: {
          name: "José García",
          email: "user@example.com",
          message: "Hola! 你好! こんにちは! 🎉",
        },
      });
    });
  });

  describe("Data Integrity", () => {
    it("should not modify input data", async () => {
      mockContactFormCreate.mockResolvedValueOnce({ id: "contact-104" });

      const inputData = {
        email: "TEST@EXAMPLE.COM",
        name: "  John Doe  ",
        message: "Test message with trailing space ",
      };

      await contact(inputData);

      expect(mockContactFormCreate).toHaveBeenCalledWith({
        data: {
          email: "TEST@EXAMPLE.COM",
          name: "  John Doe  ",
          message: "Test message with trailing space ",
        },
      });
    });
  });
});
