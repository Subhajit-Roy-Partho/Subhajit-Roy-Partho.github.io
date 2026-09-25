import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { vaultSecrets } from "@/db/schema";
import { resolveUserId, unauthorized } from "@/lib/server/api-auth";
import { BodyTooLargeError, readJsonLimited } from "@/lib/server/body-limit";
import { findDuplicates } from "@/lib/server/dedupe";
import { rateLimited } from "@/lib/server/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Scan/prune bodies are tiny ({mode}) — 4KB is ample.
const DEDUPE_BODY_MAX = 4_096;

// POST /api/vault/dedupe — on-demand duplicate handling (never on write).
// Body { mode: "scan" | "prune" } (default "scan").
//   scan:  return exact + near groups, delete nothing.
//   prune: delete exact-dupe rows keeping the oldest (MIN createdAt),
//          return deletedCount + the same near warnings (never auto-delete
//          or auto-merge near-dupes; merging stays user-driven via
//          PATCH/DELETE — each suggestion names its keepId).
export async function POST(req: Request) {
  const userId = await resolveUserId(req);
  if (!userId) return unauthorized();
  const limited = rateLimited(req, "vault");
  if (limited) return limited;

  let mode = "scan";
  const len = req.headers.get("content-length");
  if (len !== null && Number(len) > 0) {
    let body: Record<string, unknown>;
    try {
      body = await readJsonLimited(req, DEDUPE_BODY_MAX);
    } catch (e) {
      if (e instanceof BodyTooLargeError) {
        return Response.json({ error: e.message }, { status: 413 });
      }
      return Response.json({ error: "invalid json" }, { status: 400 });
    }
    if (body.mode !== undefined) {
      if (body.mode !== "scan" && body.mode !== "prune") {
        return Response.json({ error: "mode must be scan|prune" }, { status: 400 });
      }
      mode = body.mode;
    }
  }

  const rows = await db
    .select()
    .from(vaultSecrets)
    .where(eq(vaultSecrets.userId, userId));

  let result;
  try {
    result = findDuplicates(rows);
  } catch {
    return Response.json({ error: "decrypt failed" }, { status: 500 });
  }

  if (mode === "scan") {
    return Response.json(result);
  }

  // prune: delete exact-dupe rows, keeping the oldest per group.
  const dropIds = result.exact.flatMap((g) => g.dropIds);
  let deletedCount = 0;
  if (dropIds.length > 0) {
    await db
      .delete(vaultSecrets)
      .where(and(eq(vaultSecrets.userId, userId), inArray(vaultSecrets.id, dropIds)));
    deletedCount = dropIds.length;
  }
  return Response.json({ ...result, deletedCount });
}
