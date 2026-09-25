// /api/keys — thin CRUD over the better-auth apiKey plugin.
// Key hashing/storage is plugin-owned; we surface metadata only.
// The raw key value is returned ONLY in the POST (create) response.
//
// H3 trust model (also documented on /extras/apibank):
//   - Minting/deleting requires a SIGNED-IN BROWSER SESSION. Bearer API
//     keys can neither mint nor revoke keys (no privilege-escalation loop).
//   - Keys do NOT trigger a two-factor challenge at use time — treat them
//     like passwords. New keys expire after 90 days and are usage-capped
//     (see the apiKey plugin config in lib/auth.ts).
//
// TODO: reconcile method names with @better-auth/api-key docs if the
// plugin API drifts; `as any` casts keep builds green across versions.

import { auth } from "@/lib/auth";
import {
  requireSessionUserId,
  resolveUserId,
  unauthorized,
} from "@/lib/server/api-auth";
import { BodyTooLargeError, readJsonLimited } from "@/lib/server/body-limit";
import { rateLimited } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Api = Record<string, (...args: never[]) => Promise<unknown>>;

function plugin() {
  return auth.api as unknown as Api;
}

const DAY_S = 24 * 3600;
const DEFAULT_EXPIRES_IN_S = 90 * DAY_S; // must match lib/auth.ts default
const MAX_EXPIRES_IN_S = 365 * DAY_S;

// GET /api/keys — list caller's keys (metadata, never raw values).
export async function GET(req: Request) {
  const userId = await resolveUserId(req);
  if (!userId) return unauthorized();
  const limited = rateLimited(req, "keys");
  if (limited) return limited;
  try {
    const api = plugin();
    if (typeof api.listApiKeys === "function") {
      const res = (await api.listApiKeys({
        headers: req.headers,
      } as never)) as unknown as { apiKeys?: unknown[] } | unknown[];
      const keys = Array.isArray(res) ? res : (res?.apiKeys ?? res);
      return Response.json({ keys });
    }
    return Response.json(
      { error: "apiKey plugin list unavailable" },
      { status: 501 }
    );
  } catch {
    return Response.json({ error: "list failed" }, { status: 500 });
  }
}

// POST /api/keys — create { name?, expiresIn? }. Returns key once.
// Session-only: Bearer keys cannot mint keys.
export async function POST(req: Request) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return Response.json(
      { error: "sign-in session required to mint keys" },
      { status: 401 }
    );
  }
  const limited = rateLimited(req, "keys");
  if (limited) return limited;
  let body: Record<string, unknown>;
  try {
    body = await readJsonLimited(req, 8192);
  } catch (e) {
    if (e instanceof BodyTooLargeError) {
      return Response.json({ error: e.message }, { status: 413 });
    }
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim().slice(0, 64)
      : "default";
  // Clamp client-requested TTL into the plugin's 1–365 day window; the
  // plugin default (90d) applies when omitted.
  let expiresIn = DEFAULT_EXPIRES_IN_S;
  if (body.expiresIn !== undefined) {
    if (typeof body.expiresIn !== "number" || !Number.isFinite(body.expiresIn)) {
      return Response.json({ error: "bad expiresIn" }, { status: 400 });
    }
    expiresIn = Math.min(
      MAX_EXPIRES_IN_S,
      Math.max(DAY_S, Math.floor(body.expiresIn))
    );
  }
  try {
    const api = plugin();
    if (typeof api.createApiKey === "function") {
      // No userId in body: for client requests the plugin derives the
      // owner from the session (passing userId throws UNAUTHORIZED).
      const res = (await api.createApiKey({
        headers: req.headers,
        body: {
          name,
          expiresIn,
          ...(typeof body.prefix === "string" && body.prefix
            ? { prefix: body.prefix.slice(0, 32) }
            : {}),
        },
      } as never)) as unknown;
      return Response.json(res, { status: 201 });
    }
    return Response.json(
      { error: "apiKey plugin create unavailable" },
      { status: 501 }
    );
  } catch {
    return Response.json({ error: "create failed" }, { status: 500 });
  }
}
