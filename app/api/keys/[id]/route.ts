import { eq } from "drizzle-orm";

import { db } from "@/db";
import { apikey } from "@/db/schema";
import { auth } from "@/lib/auth";
import { requireSessionUserId } from "@/lib/server/api-auth";
import { rateLimited } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Api = Record<string, (...args: never[]) => Promise<unknown>>;

// DELETE /api/keys/:id — delete caller's key by key id.
// H3: session-only (Bearer keys can't revoke keys), and ownership is
// verified against the apikey table first so a key id can never address
// another user's key. Unknown/foreign ids return 404 alike.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await requireSessionUserId();
  if (!userId) {
    return Response.json(
      { error: "sign-in session required to delete keys" },
      { status: 401 }
    );
  }
  const limited = rateLimited(req, "keys");
  if (limited) return limited;
  const { id } = await params;
  const rows = await db
    .select({ userId: apikey.userId })
    .from(apikey)
    .where(eq(apikey.id, id));
  if (!rows[0] || rows[0].userId !== userId) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  try {
    const api = auth.api as unknown as Api;
    const fn = api.deleteApiKey ?? api.deleteApiKeys;
    if (typeof fn === "function") {
      await fn({ headers: req.headers, body: { keyId: id } } as never);
      return Response.json({ ok: true });
    }
    return Response.json(
      { error: "apiKey plugin delete unavailable" },
      { status: 501 }
    );
  } catch {
    return Response.json({ error: "delete failed" }, { status: 500 });
  }
}
