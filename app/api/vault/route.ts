import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "@/db";
import { vaultSecrets } from "@/db/schema";
import { parseAllowedHosts } from "@/lib/server/allowed-hosts";
import { resolveUserId, unauthorized } from "@/lib/server/api-auth";
import { BodyTooLargeError, readJsonLimited } from "@/lib/server/body-limit";
import { rateLimited } from "@/lib/server/rate-limit";
import { encryptSecret, maskPreview } from "@/lib/server/vault-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Vault writes are small (value cap 16KB): 32KB covers name/value/hosts
// envelope with headroom while bounding parse memory (M2).
const WRITE_BODY_MAX = 32_768;

// GET /api/vault — list caller's secrets (metadata + masked preview only).
export async function GET(req: Request) {
  const userId = await resolveUserId(req);
  if (!userId) return unauthorized();
  const limited = rateLimited(req, "vault");
  if (limited) return limited;
  const rows = await db
    .select()
    .from(vaultSecrets)
    .where(eq(vaultSecrets.userId, userId));
  return Response.json({
    secrets: rows.map((r) => ({
      id: r.id,
      name: r.name,
      allowedHosts: r.allowedHostsJson ? JSON.parse(r.allowedHostsJson) : null,
      injectAs: r.injectAs,
      preview: maskPreview(r.ciphertext),
      lastUsedAt: r.lastUsedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
  });
}

// POST /api/vault — create { name, value, allowedHosts?, injectAs? }.
export async function POST(req: Request) {
  const userId = await resolveUserId(req);
  if (!userId) return unauthorized();
  const limited = rateLimited(req, "vault");
  if (limited) return limited;
  let body: Record<string, unknown>;
  try {
    body = await readJsonLimited(req, WRITE_BODY_MAX);
  } catch (e) {
    if (e instanceof BodyTooLargeError) {
      return Response.json({ error: e.message }, { status: 413 });
    }
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { name, value, allowedHosts, injectAs } = body as {
    name?: unknown;
    value?: unknown;
    allowedHosts?: unknown;
    injectAs?: unknown;
  };
  if (typeof name !== "string" || !name.trim()) {
    return Response.json({ error: "name required" }, { status: 400 });
  }
  if (typeof value !== "string" || !value) {
    return Response.json({ error: "value required" }, { status: 400 });
  }
  if (value.length > 16_384) {
    return Response.json({ error: "value too large (max 16KB)" }, { status: 413 });
  }
  let hosts: string[] | null;
  try {
    hosts = parseAllowedHosts(allowedHosts);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "bad allowedHosts" },
      { status: 400 }
    );
  }
  const inject = injectAs === "body" ? "body" : "header";

  // Enforce unique(userId, name).
  const existing = await db
    .select({ id: vaultSecrets.id })
    .from(vaultSecrets)
    .where(
      and(eq(vaultSecrets.userId, userId), eq(vaultSecrets.name, name.trim()))
    );
  if (existing.length > 0) {
    return Response.json({ error: "name already exists" }, { status: 409 });
  }

  const { ciphertext, iv, keyVersion } = encryptSecret(value);
  const id = randomUUID();
  await db.insert(vaultSecrets).values({
    id,
    userId,
    name: name.trim(),
    allowedHostsJson: hosts ? JSON.stringify(hosts) : null,
    injectAs: inject,
    ciphertext,
    iv,
    keyVersion,
  });
  return Response.json({ id, name: name.trim() }, { status: 201 });
}
