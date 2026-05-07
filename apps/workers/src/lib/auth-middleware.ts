import type { MiddlewareHandler } from "hono";
import { OAuth2Client } from "google-auth-library";

/**
 * Authentication middleware for /jobs/* routes.
 *
 * Production: GCP Pub/Sub push subscriptions sign each delivery with an OIDC
 * token. We verify the JWT against Google's public keys, then check the
 * audience matches the worker URL and (optionally) the service-account email
 * matches a configured allowlist.
 *
 * Local dev: a static `WORKER_DEV_TOKEN` env var is accepted so devs can curl
 * the routes without a real Pub/Sub push.
 *
 * Failure mode: 401. We log the rejection reason once but do NOT surface it
 * in the response (avoid telling attackers which check failed).
 */

const oauthClient = new OAuth2Client();

let cachedAudience: string | null | undefined;
function getAudience(): string | null {
  if (cachedAudience !== undefined) return cachedAudience;
  const explicit = process.env.WORKER_AUDIENCE?.trim();
  if (explicit) {
    cachedAudience = explicit;
    return cachedAudience;
  }
  const url = process.env.WORKER_PUBLIC_URL?.trim();
  cachedAudience = url ? url.replace(/\/+$/, "") : null;
  return cachedAudience;
}

function getAllowedServiceAccounts(): Set<string> {
  const raw = process.env.WORKER_ALLOWED_INVOKERS?.trim() || "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const requireWorkerAuth: MiddlewareHandler = async (c, next) => {
  const authHeader = c.req.header("authorization") || "";

  // Local-dev shared secret (only honored when WORKER_DEV_TOKEN is set).
  const devToken = process.env.WORKER_DEV_TOKEN;
  if (devToken && authHeader === `Bearer ${devToken}`) {
    return next();
  }

  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  if (!match) {
    console.warn("[auth] missing bearer token");
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = match[1].trim();

  const audience = getAudience();
  if (!audience) {
    // Refuse rather than blindly trust — operator must set WORKER_AUDIENCE.
    console.error(
      "[auth] WORKER_AUDIENCE / WORKER_PUBLIC_URL not configured; refusing request",
    );
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken: token,
      audience,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      console.warn("[auth] verifyIdToken returned empty payload");
      return c.json({ error: "Unauthorized" }, 401);
    }

    const allowed = getAllowedServiceAccounts();
    if (allowed.size > 0) {
      const email = payload.email?.toLowerCase();
      if (!email || !allowed.has(email)) {
        console.warn(
          `[auth] service account not in allowlist: ${email ?? "<no email>"}`,
        );
        return c.json({ error: "Unauthorized" }, 401);
      }
    }

    return next();
  } catch (err) {
    console.warn(
      "[auth] OIDC token verification failed:",
      err instanceof Error ? err.message : String(err),
    );
    return c.json({ error: "Unauthorized" }, 401);
  }
};
