/**
 * Validate a `redirect_url` query parameter so it can only point back to
 * pages on the current origin. Anything else collapses to the fallback path.
 */
export function safeReturnUrl(
  raw: string | null | undefined,
  fallback: string = "/",
): string {
  if (!raw || typeof raw !== "string") return fallback;

  if (raw.startsWith("/")) {
    if (raw.startsWith("//")) return fallback;
    if (/^\/[^/]/.test(raw) || raw === "/") return raw;
    return fallback;
  }

  try {
    const url = new URL(raw);
    const allowed = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
    if (!allowed) return fallback;
    const allowedOrigin = new URL(allowed).origin;
    if (url.origin === allowedOrigin)
      return url.pathname + url.search + url.hash;
  } catch {
    /* fall through */
  }
  return fallback;
}
