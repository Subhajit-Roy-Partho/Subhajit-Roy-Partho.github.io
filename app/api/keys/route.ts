// /api/keys — thin CRUD over the better-auth apiKey plugin.
// Key hashing/storage is plugin-owned; we surface metadata only.
// The raw key value is returned ONLY in the POST (create) response.
//
// TODO: reconcile method names with @better-auth/api-key docs if the
// plugin API drifts; `as any` casts keep builds green across versions.

import { auth } from "@/lib/auth";
import { resolveUserId, unauthorized } from "@/lib/server/api-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Api = Record<string, (...args: never[]) => Promise<unknown>>;

function plugin() {
  return auth.api as unknown as Api;
}

// GET /api/keys — list caller's keys (metadata, never raw values).
export async function GET(req: Request) {
  const userId = await resolveUserId(req);
  if (!userId) return unauthorized();
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

// POST /api/keys — create { name?, expiresIn?, prefix? }. Returns key once.
export async function POST(req: Request) {
  const userId = await resolveUserId(req);
  if (!userId) return unauthorized();
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  try {
    const api = plugin();
    if (typeof api.createApiKey === "function") {
      const res = (await api.createApiKey({
        headers: req.headers,
        body: {
          name:
            typeof body.name === "string" && body.name ? body.name : "default",
          ...(typeof body.expiresIn === "number"
            ? { expiresIn: body.expiresIn }
            : {}),
          ...(typeof body.prefix === "string" && body.prefix
            ? { prefix: body.prefix }
            : {}),
          userId,
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
