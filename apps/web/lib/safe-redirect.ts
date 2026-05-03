/**
 * Validate a `redirect_url` query parameter so it can only point back to
 * pages on the current origin. Anything else (different host, different
 * scheme, malformed URL) collapses to the fallback path.
 *
 * Without this, an attacker can craft `?redirect_url=https://evil.example/steal`
 * and bounce the user there immediately after Clerk authenticates them.
 */
export function safeReturnUrl(
  raw: string | null | undefined,
  fallback: string = "/",
): string {
  if (!raw) return fallback;
  if (typeof raw !== "string") return fallback;

  // Bare path: must start with `/` and not look like a protocol-relative URL
  // (`//host`) or a JS/data scheme.
  if (raw.startsWith("/")) {
    if (raw.startsWith("//")) return fallback;
    if (/^\/[^/]/.test(raw) || raw === "/") return raw;
    return fallback;
  }

  // Absolute URL: must parse and match the deployment origin.
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
