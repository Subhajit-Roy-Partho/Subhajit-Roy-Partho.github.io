import { eq } from "drizzle-orm";

import { db } from "@/db";
import { apikey, user } from "@/db/schema";
import { resolveUserId, unauthorized } from "@/lib/server/api-auth";
import { rateLimited } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// H4: banning via the better-auth admin endpoint does not itself delete
// rows from the plugin-owned apikey table, so banned accounts could keep
// calling with outstanding Bearer keys (enforcement also happens in
// resolveUserId, but hygiene matters). These admin-only endpoints let the
// admin board audit and revoke a user's keys at ban time.

async function requireAdmin(
  req: Request
): Promise<{ adminId: string } | { response: Response }> {
  const uid = await resolveUserId(req);
  if (!uid) return { response: unauthorized() };
  const rows = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, uid));
  if (rows[0]?.role !== "admin") {
    return { response: Response.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { adminId: uid };
}

// GET /api/admin/users/:id/keys — list key metadata for any user (admin).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;
  const limited = rateLimited(req, "admin");
  if (limited) return limited;
  const { id } = await params;
  const rows = await db
    .select({
      id: apikey.id,
      name: apikey.name,
      createdAt: apikey.createdAt,
      expiresAt: apikey.expiresAt,
      lastRequest: apikey.lastRequest,
      enabled: apikey.enabled,
    })
    .from(apikey)
    .where(eq(apikey.userId, id));
  return Response.json({ keys: rows });
}

// DELETE /api/admin/users/:id/keys — revoke ALL keys for a user (admin).
// The admin board calls this immediately after a ban.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;
  const limited = rateLimited(req, "admin");
  if (limited) return limited;
  const { id } = await params;
  const deleted = await db
    .delete(apikey)
    .where(eq(apikey.userId, id))
    .returning({ id: apikey.id });
  return Response.json({ revoked: deleted.length });
}
