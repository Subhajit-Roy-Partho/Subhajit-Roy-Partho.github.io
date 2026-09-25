import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "@/db";
import { vaultSecrets } from "@/db/schema";
import { resolveUserId, unauthorized } from "@/lib/server/api-auth";
import { encryptSecret, maskPreview } from "@/lib/server/vault-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseAllowedHosts(raw: unknown): string[] | null {
  if (raw == null) return null;
  if (!Array.isArray(raw)) throw new Error("allowedHosts must be an array");
  if (raw.length > 10) throw new Error("allowedHosts max 10 entries");
  return raw.map((h) => {
    if (typeof h !== "string" || !h) throw new Error("allowedHosts entries must be non-empty strings");
    return h.trim().toLowerCase();
  });
}

// GET /api/vault — list caller's secrets (metadata + masked preview only).
export async function GET(req: Request) {
  const userId = await resolveUserId(req);
  if (!userId) return unauthorized();
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
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
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
