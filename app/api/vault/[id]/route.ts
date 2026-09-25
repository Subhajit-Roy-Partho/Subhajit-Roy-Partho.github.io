import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { vaultSecrets } from "@/db/schema";
import { parseAllowedHosts } from "@/lib/server/allowed-hosts";
import { resolveUserId, unauthorized } from "@/lib/server/api-auth";
import { BodyTooLargeError, readJsonLimited } from "@/lib/server/body-limit";
import { rateLimited } from "@/lib/server/rate-limit";
import {
  decryptSecret,
  encryptSecret,
  maskPreview,
} from "@/lib/server/vault-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WRITE_BODY_MAX = 32_768;

async function owned(id: string, userId: string) {
  const rows = await db
    .select()
    .from(vaultSecrets)
    .where(and(eq(vaultSecrets.id, id), eq(vaultSecrets.userId, userId)));
  return rows[0] ?? null;
}

function meta(r: NonNullable<Awaited<ReturnType<typeof owned>>>) {
  return {
    id: r.id,
    name: r.name,
    allowedHosts: r.allowedHostsJson ? JSON.parse(r.allowedHostsJson) : null,
    injectAs: r.injectAs,
    preview: maskPreview(r.ciphertext),
    lastUsedAt: r.lastUsedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// GET /api/vault/:id — owner read returns plaintext value; nothing else does.
// Query ?reveal=1 returns { value }; default returns metadata only.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await resolveUserId(req);
  if (!userId) return unauthorized();
  const limited = rateLimited(req, "vault");
  if (limited) return limited;
  const { id } = await params;
  const row = await owned(id, userId);
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  const url = new URL(req.url);
  if (url.searchParams.get("reveal") === "1") {
    // M5: a corrupt envelope or rotated/missing key must be a clean 500,
    // never an unhandled throw.
    try {
      return Response.json({ ...meta(row), value: decryptSecret(row.ciphertext) });
    } catch {
      return Response.json({ error: "decrypt failed" }, { status: 500 });
    }
  }
  return Response.json(meta(row));
}

// PATCH /api/vault/:id — { name?, value?, allowedHosts?, injectAs? }.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await resolveUserId(req);
  if (!userId) return unauthorized();
  const limited = rateLimited(req, "vault");
  if (limited) return limited;
  const { id } = await params;
  const row = await owned(id, userId);
  if (!row) return Response.json({ error: "not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await readJsonLimited(req, WRITE_BODY_MAX);
  } catch (e) {
    if (e instanceof BodyTooLargeError) {
      return Response.json({ error: e.message }, { status: 413 });
    }
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const patch: Partial<typeof vaultSecrets.$inferInsert> = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return Response.json({ error: "bad name" }, { status: 400 });
    }
    patch.name = body.name.trim();
  }
  if (body.value !== undefined) {
    if (typeof body.value !== "string" || !body.value) {
      return Response.json({ error: "bad value" }, { status: 400 });
    }
    if (body.value.length > 16_384) {
      return Response.json({ error: "value too large (max 16KB)" }, { status: 413 });
    }
    const enc = encryptSecret(body.value);
    patch.ciphertext = enc.ciphertext;
    patch.iv = enc.iv;
    patch.keyVersion = enc.keyVersion;
  }
  if (body.allowedHosts !== undefined) {
    // M1: same normalization as POST (trim + lowercase) so the proxy's
    // exact-match can't be bypassed by cosmetic variants. null disables.
    try {
      const hosts = parseAllowedHosts(body.allowedHosts);
      patch.allowedHostsJson = hosts ? JSON.stringify(hosts) : null;
    } catch (e) {
      return Response.json(
        { error: e instanceof Error ? e.message : "bad allowedHosts" },
        { status: 400 }
      );
    }
  }
  if (body.injectAs !== undefined) {
    patch.injectAs = body.injectAs === "body" ? "body" : "header";
  }
  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "empty patch" }, { status: 400 });
  }
  try {
    await db
      .update(vaultSecrets)
      .set(patch)
      .where(and(eq(vaultSecrets.id, id), eq(vaultSecrets.userId, userId)));
  } catch {
    return Response.json({ error: "name already exists" }, { status: 409 });
  }
  const updated = await owned(id, userId);
  return Response.json(meta(updated!));
}

// DELETE /api/vault/:id
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await resolveUserId(req);
  if (!userId) return unauthorized();
  const limited = rateLimited(req, "vault");
  if (limited) return limited;
  const { id } = await params;
  const row = await owned(id, userId);
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  await db
    .delete(vaultSecrets)
    .where(and(eq(vaultSecrets.id, id), eq(vaultSecrets.userId, userId)));
  return Response.json({ ok: true });
}
