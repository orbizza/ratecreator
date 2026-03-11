import { createHmac, randomBytes } from "crypto";
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
    .update(email)
    .digest("hex");
}

/**
 * Verify an HMAC unsubscribe token for a given email
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!EMAIL_UNSUBSCRIBE_SECRET) {
    return false;
  }
  const expected = generateUnsubscribeToken(email);
  return expected === token;
}
