import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time check that the request bears a valid `Bearer <CRON_SECRET>`
 * header. Refuses if `CRON_SECRET` is unset (otherwise the comparison string
 * would be the literal "Bearer undefined" and any caller knowing that would
 * succeed).
 */
export function isAuthorizedCronRequest(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron] CRON_SECRET is not set; refusing request");
    return false;
  }
  if (!authHeader) return false;

  const expected = `Bearer ${secret}`;
  const provided = authHeader;

  // Length-pad to avoid leaking the expected length via timing-equal-length.
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
