// Best-effort per-IP fixed-window rate limiter for API routes.
//
// In-memory only: each serverless instance tracks its own counters, so this
// blunts single-instance abuse (credential stuffing on /api/auth, vault
// enumeration, proxy/token burn) rather than providing global accounting.
// For fleet-wide limits put a Redis/edge counter in front. Limits are
// deliberately generous — they trip on abuse, not on normal use.
import "server-only";

type Bucket = "auth" | "vault" | "proxy" | "keys" | "admin";

const LIMITS: Record<Bucket, { max: number; windowMs: number }> = {
  auth: { max: 30, windowMs: 60_000 },
  vault: { max: 120, windowMs: 60_000 },
  proxy: { max: 60, windowMs: 60_000 },
  keys: { max: 30, windowMs: 60_000 },
  admin: { max: 60, windowMs: 60_000 },
};

const hits = new Map<string, { count: number; reset: number }>();

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 64);
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim().slice(0, 64);
  return "local";
}

export function checkRateLimit(
  req: Request,
  bucket: Bucket
): { ok: boolean; retryAfterSec: number } {
  const { max, windowMs } = LIMITS[bucket];
  const key = `${bucket}:${clientIp(req)}`;
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || now >= cur.reset) {
    // Opportunistic sweep so the map can't grow without bound.
    if (hits.size > 5000) {
      for (const [k, v] of hits) {
        if (v.reset <= now) hits.delete(k);
      }
    }
    hits.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }
  cur.count += 1;
  if (cur.count > max) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((cur.reset - now) / 1000)),
    };
  }
  return { ok: true, retryAfterSec: 0 };
}

/** Returns a 429 Response when the bucket is exhausted, else null. */
export function rateLimited(req: Request, bucket: Bucket): Response | null {
  const r = checkRateLimit(req, bucket);
  if (r.ok) return null;
  return Response.json(
    { error: "rate limited, try again soon" },
    { status: 429, headers: { "retry-after": String(r.retryAfterSec) } }
  );
}
