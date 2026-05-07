import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { EMAIL_UNSUBSCRIBE_SECRET } from "./constants";

/**
 * Generate a random verification token for double opt-in
 */
export function generateVerifyToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Generate an HMAC-based unsubscribe token for a given email
 */
export function generateUnsubscribeToken(email: string): string {
  if (!EMAIL_UNSUBSCRIBE_SECRET) {
    throw new Error("EMAIL_UNSUBSCRIBE_SECRET is not set");
  }
  return createHmac("sha256", EMAIL_UNSUBSCRIBE_SECRET)
    .update(email.toLowerCase())
    .digest("hex");
}

/**
 * Verify an HMAC unsubscribe token for a given email. Uses timing-safe
 * comparison so the secret cannot be probed via response-time analysis.
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!EMAIL_UNSUBSCRIBE_SECRET) {
    return false;
  }
  let expected: string;
  try {
    expected = generateUnsubscribeToken(email);
  } catch {
    return false;
  }
  // hex → 64 chars; refuse anything else immediately to avoid leaking length.
  if (typeof token !== "string" || token.length !== expected.length) {
    return false;
  }
  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(token, "hex"),
    );
  } catch {
    return false;
  }
}
