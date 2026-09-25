// On-demand duplicate detection for vault secrets. Server-only.
//
// Never runs on write — only when the caller explicitly hits
// POST /api/vault/dedupe. Decrypts values server-side, groups rows, and
// returns ids + names + matched-on fields + masked previews only.
// Plaintext values are never logged, never returned, and never persisted.
import "server-only";

import { createHash } from "node:crypto";

import { decryptSecret } from "@/lib/server/vault-crypto";

export type DedupeInput = {
  id: string;
  name: string;
  allowedHostsJson: string | null;
  injectAs: string;
  ciphertext: string;
  createdAt: Date | number | string | null;
};

export type ExactGroup = {
  keepId: string;
  keepName: string;
  dropIds: string[];
  /** Names of the dropped rows (same as keepName for exact dupes). */
  names: string[];
  preview: string;
};

export type NearGroup = {
  ids: string[];
  names: string[];
  matchedOn: string[];
  suggestion: string;
  preview: string;
};

export type DedupeResult = {
  exact: ExactGroup[];
  near: NearGroup[];
};

const MASKED = "••••••••";

function createdAtMs(v: DedupeInput["createdAt"]): number {
  if (v instanceof Date) return v.getTime();
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : 0;
  }
  return 0;
}

/** Trim + lowercase + sort so cosmetic variants compare equal. */
export function normalizeHosts(raw: string | null): string | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return raw.trim().toLowerCase() || null;
  }
  if (!Array.isArray(parsed)) return null;
  const list = parsed
    .filter((h): h is string => typeof h === "string")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean)
    .sort();
  return list.length > 0 ? JSON.stringify(list) : null;
}

function sha256(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

type Decrypted = DedupeInput & {
  valueHash: string;
  hostsNorm: string | null;
};

/**
 * Group an owner's secrets into EXACT (name+value+hosts+injectAs all equal)
 * and NEAR (same value but different name/hosts/inject, OR same name with
 * different value/hosts) duplicate sets.
 */
export function findDuplicates(secrets: DedupeInput[]): DedupeResult {
  const rows: Decrypted[] = [];
  for (const s of secrets) {
    let value: string;
    try {
      value = decryptSecret(s.ciphertext);
    } catch {
      // Corrupt envelope / rotated key: skip rather than abort the scan.
      continue;
    }
    // Hash immediately; the plaintext is not retained or logged.
    rows.push({ ...s, valueHash: sha256(value), hostsNorm: normalizeHosts(s.allowedHostsJson) });
  }

  const exact: ExactGroup[] = [];
  const near: NearGroup[] = [];

  // EXACT: name + value + normalized hosts + injectAs all equal.
  const exactMap = new Map<string, Decrypted[]>();
  for (const r of rows) {
    const key = JSON.stringify([r.name, r.valueHash, r.hostsNorm, r.injectAs]);
    const g = exactMap.get(key);
    if (g) g.push(r);
    else exactMap.set(key, [r]);
  }
  const exactIds = new Set<string>();
  for (const g of exactMap.values()) {
    if (g.length < 2) continue;
    const sorted = [...g].sort((a, b) => createdAtMs(a.createdAt) - createdAtMs(b.createdAt));
    const keep = sorted[0];
    const drops = sorted.slice(1);
    exact.push({
      keepId: keep.id,
      keepName: keep.name,
      dropIds: drops.map((d) => d.id),
      names: drops.map((d) => d.name),
      preview: MASKED,
    });
    for (const r of g) exactIds.add(r.id);
  }

  // NEAR: same decrypted value, differing in name/hosts/inject.
  const valueMap = new Map<string, Decrypted[]>();
  for (const r of rows) {
    const g = valueMap.get(r.valueHash);
    if (g) g.push(r);
    else valueMap.set(r.valueHash, [r]);
  }
  const emittedNear = new Set<string>();
  for (const g of valueMap.values()) {
    if (g.length < 2) continue;
    // A group that is fully exact is already reported above, not as near.
    const exactKey = JSON.stringify([
      g[0].name,
      g[0].valueHash,
      g[0].hostsNorm,
      g[0].injectAs,
    ]);
    if (g.every((r) => JSON.stringify([r.name, r.valueHash, r.hostsNorm, r.injectAs]) === exactKey)) {
      continue;
    }
    const sorted = [...g].sort((a, b) => createdAtMs(a.createdAt) - createdAtMs(b.createdAt));
    const keep = sorted[0];
    const diff: string[] = [];
    if (g.some((r) => r.name !== g[0].name)) diff.push("name");
    if (g.some((r) => r.hostsNorm !== g[0].hostsNorm)) diff.push("allowedHosts");
    if (g.some((r) => r.injectAs !== g[0].injectAs)) diff.push("injectAs");
    near.push({
      ids: sorted.map((r) => r.id),
      names: sorted.map((r) => r.name),
      matchedOn: ["value", ...diff],
      suggestion: `Same value in ${sorted.length} secrets — keep "${keep.name}" (${keep.id}) and merge manually via PATCH/DELETE; near-dupes are never auto-deleted.`,
      preview: MASKED,
    });
    emittedNear.add(g[0].valueHash);
  }

  // NEAR: same name with different value/hosts. (The unique(userId,name)
  // constraint normally prevents this; handled defensively.)
  const nameMap = new Map<string, Decrypted[]>();
  for (const r of rows) {
    const g = nameMap.get(r.name);
    if (g) g.push(r);
    else nameMap.set(r.name, [r]);
  }
  for (const [name, g] of nameMap) {
    if (g.length < 2) continue;
    if (g.every((r) => exactIds.has(r.id))) continue;
    const sorted = [...g].sort((a, b) => createdAtMs(a.createdAt) - createdAtMs(b.createdAt));
    const keep = sorted[0];
    const diff: string[] = [];
    if (g.some((r) => r.valueHash !== g[0].valueHash)) diff.push("value");
    if (g.some((r) => r.hostsNorm !== g[0].hostsNorm)) diff.push("allowedHosts");
    if (g.some((r) => r.injectAs !== g[0].injectAs)) diff.push("injectAs");
    near.push({
      ids: sorted.map((r) => r.id),
      names: sorted.map((r) => r.name),
      matchedOn: ["name", ...diff],
      suggestion: `Same name "${name}" with different content — keep "${keep.name}" (${keep.id}) and merge manually via PATCH/DELETE; near-dupes are never auto-deleted.`,
      preview: MASKED,
    });
  }

  void emittedNear;
  return { exact, near };
}
