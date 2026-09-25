// POST /api/proxy/:secretId — authenticated server-side fetch that injects
// the caller's vault secret upstream without ever exposing it to the browser.
//
// Contract (designer UI depends on this):
//   body: { url, method?, headers?, body? }
//   - url: https only, default port, no userinfo; hostname must exactly
//     match one of the secret's allowedHosts (lowercased, max 10). Secrets
//     with allowedHosts=null cannot be proxied (proxy disabled).
//   - injectAs "header" (default): sets `Authorization: Bearer <secret>`
//     (overwrites any caller-supplied Authorization).
//   - injectAs "body": request body must be a JSON object (string); the
//     secret is merged in as the `secret` field.
//   - caller body cap: 1MB. Upstream timeout: 10s. Redirects: manual
//     (upstream 3xx is returned as-is, never followed).
//   - reserved/private targets are rejected (DNS-resolved, re-checked
//     after the call — see H2 note below).
//   - response: { status, headers, body (text, truncated at 1MB) }.
//     Secret-carrying headers are stripped from returned headers and the
//     secret is never echoed.
// Every call (success or failure) is written to audit_logs.
//
// H2 (DNS TOCTOU) note: we deliberately fetch by HOSTNAME (not by pinned
// IP) so TLS SNI/Host and certificate validation stay intact — dialing a
// raw IP would either break cert checks or require disabling them, which
// is worse. Containment instead: resolve → enforce → fetch (manual
// redirects, so 3xx can't smuggle a new host) → RE-RESOLVE and abort on
// any mismatch or newly-private answer. An attacker must then hold a
// poisoned record across both resolutions AND match the allowlist.

import { lookup } from "node:dns/promises";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { auditLogs, vaultSecrets } from "@/db/schema";
import { resolveUserId, unauthorized } from "@/lib/server/api-auth";
import { BodyTooLargeError, readJsonLimited } from "@/lib/server/body-limit";
import { rateLimited } from "@/lib/server/rate-limit";
import { decryptSecret } from "@/lib/server/vault-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const BODY_CAP = 1_000_000; // 1MB
const TIMEOUT_MS = 10_000;
// Outer JSON envelope cap: caller body (≤1MB) + headers + URL overhead.
const ENVELOPE_CAP = BODY_CAP + 65_536;
const MAX_HEADERS = 50;
const MAX_HEADER_NAME = 256;
const MAX_HEADER_VALUE = 16_384;
const MAX_HEADERS_TOTAL = 65_536;
const STRIPPED_RESPONSE_HEADERS = new Set([
  "authorization",
  "proxy-authorization",
  "x-vault-secret",
  "x-api-key",
  "api-key",
  "cookie",
  "set-cookie",
]);

// --- H1: reserved/private range coverage --------------------------------

function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }
  if (p[0] === 0) return true; // 0.0.0.0/8 ("this network" — never routable)
  if (p[0] === 10) return true; // 10/8
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true; // 172.16/12
  if (p[0] === 192 && p[1] === 168) return true; // 192.168/16
  if (p[0] === 127) return true; // 127/8
  if (p[0] === 169 && p[1] === 254) return true; // link-local (incl. 169.254.169.254)
  if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true; // 100.64/10 CGNAT
  if (p[0] === 192 && p[1] === 0 && p[2] === 0) return true; // 192.0.0.0/24 (IETF protocol assignments)
  if (p[0] === 198 && (p[1] === 18 || p[1] === 19)) return true; // 198.18/15 benchmarking
  return false;
}

/** Strip an RFC 6874 zone id ("fe80::1%eth0") before classification. */
function stripZone(ip: string): string {
  const pct = ip.indexOf("%");
  return pct === -1 ? ip : ip.slice(0, pct);
}

/**
 * Unwrap an IPv4-mapped IPv6 address (::ffff:0:0/96) to its embedded IPv4.
 * Handles dotted ("::ffff:1.2.3.4") and hex ("::ffff:0102:0304", including
 * uncompressed "0:0:0:0:0:ffff:..." forms). Returns null when not mapped.
 */
function unwrapMapped(n: string): string | null {
  const idx = n.lastIndexOf(":ffff:");
  if (idx === -1) return null;
  if (!/^[0:]*$/.test(n.slice(0, idx))) return null;
  const tail = n.slice(idx + ":ffff:".length);
  if (/^\d+\.\d+\.\d+\.\d+$/.test(tail)) return tail;
  const hx = tail.split(":");
  if (hx.length === 2 && hx.every((h) => /^[0-9a-f]{1,4}$/.test(h))) {
    const a = parseInt(hx[0], 16);
    const b = parseInt(hx[1], 16);
    return `${(a >> 8) & 255}.${a & 255}.${(b >> 8) & 255}.${b & 255}`;
  }
  return null;
}

function isPrivateIPv6(ip: string): boolean {
  const n = stripZone(ip).toLowerCase();
  // Mapped → classify the embedded IPv4 (a public embedded address stays
  // reachable, e.g. ::ffff:8.8.8.8 dials public 8.8.8.8 — fine).
  const mapped = unwrapMapped(n);
  if (mapped !== null) return isPrivateIPv4(mapped);
  if (n === "::") return true; // unspecified
  if (n === "::1") return true; // loopback
  const first = n.split(":")[0];
  // fc00::/7 unique-local: first 7 bits 1111110 → first byte fc/fd.
  if (/^(fc|fd)[0-9a-f]{0,2}$/.test(first)) return true;
  // fe80::/10 link-local: first 10 bits 1111111010 → fe80..febf.
  if (/^fe[89ab][0-9a-f]?$/i.test(first)) return true;
  // 64:ff9b::/96 NAT64 well-known prefix (first 96 bits fixed).
  if (n.startsWith("64:ff9b::")) return true;
  if (/^64:ff9b:(0:){4}[0-9a-f:.]+$/.test(n)) return true;
  return false;
}

function isLiteralIp(host: string): boolean {
  if (/^[0-9.]+$/.test(host)) return true;
  if (host.includes(":")) return true;
  return false;
}

function classifyLiteral(host: string): boolean {
  const h = stripZone(host);
  return h.includes(":") ? isPrivateIPv6(h) : isPrivateIPv4(h);
}

/**
 * Resolve a hostname and enforce that EVERY answer is a public address.
 * Returns the sorted unique address set ("pin") for post-call comparison.
 * Throws "private target rejected" or "dns resolution failed".
 */
async function resolvePublicAddrs(hostname: string): Promise<string[]> {
  let addrs: Array<{ address: string }>;
  try {
    addrs = await lookup(hostname, { all: true });
  } catch {
    throw new Error("dns resolution failed");
  }
  if (addrs.length === 0) throw new Error("dns resolution failed");
  const out = addrs.map((a) => stripZone(a.address).toLowerCase());
  for (const ip of out) {
    if (ip.includes(":") ? isPrivateIPv6(ip) : isPrivateIPv4(ip)) {
      throw new Error("private target rejected");
    }
  }
  return [...new Set(out)].sort();
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ secretId: string }> }
) {
  const userId = await resolveUserId(req);
  if (!userId) return unauthorized();
  const limited = rateLimited(req, "proxy");
  if (limited) return limited;
  const { secretId } = await params;

  const fail = async (status: number, error: string, host?: string) => {
    await db.insert(auditLogs).values({
      id: randomUUID(),
      actorUserId: userId,
      action: "proxy",
      targetType: "vault_secret",
      targetId: secretId,
      targetHost: host ?? null,
      status: `blocked:${error}`,
    });
    return Response.json({ error }, { status });
  };

  const rows = await db
    .select()
    .from(vaultSecrets)
    .where(
      and(eq(vaultSecrets.id, secretId), eq(vaultSecrets.userId, userId))
    );
  const secret = rows[0];
  if (!secret) return fail(404, "not found");

  // M2: capped envelope parse (Content-Length pre-check + streaming cap).
  let payload: Record<string, unknown>;
  try {
    payload = await readJsonLimited(req, ENVELOPE_CAP);
  } catch (e) {
    if (e instanceof BodyTooLargeError) {
      return fail(413, "body too large");
    }
    return fail(400, "invalid json");
  }

  if (typeof payload.url !== "string") return fail(400, "url required");
  let target: URL;
  try {
    target = new URL(payload.url);
  } catch {
    return fail(400, "bad url");
  }
  if (target.protocol !== "https:") return fail(400, "https only");
  // M3: no credentials in the URL, and only the default https port.
  if (target.username || target.password) {
    return fail(400, "credentials in url are rejected");
  }
  if (target.port !== "" && target.port !== "443") {
    return fail(400, "only the default https port is allowed");
  }

  const host = target.hostname.toLowerCase();
  let allowed: string[] | null;
  try {
    allowed = secret.allowedHostsJson
      ? (JSON.parse(secret.allowedHostsJson) as string[])
      : null;
  } catch {
    return fail(403, "host not allowed", host);
  }
  if (!allowed || !allowed.includes(host)) {
    return fail(403, "host not allowed", host);
  }

  // Pre-call DNS pin (H1 ranges enforced inside resolvePublicAddrs).
  const literal = isLiteralIp(host);
  let pinned: string[] | null = null;
  try {
    if (literal) {
      if (classifyLiteral(host)) {
        return fail(403, "private target rejected", host);
      }
    } else {
      pinned = await resolvePublicAddrs(host);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "private target rejected") {
      return fail(403, "private target rejected", host);
    }
    return fail(502, "dns failed", host);
  }

  const method =
    typeof payload.method === "string"
      ? payload.method.toUpperCase()
      : "GET";
  if (!["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].includes(method)) {
    return fail(400, "bad method", host);
  }

  // M2: caller headers are bounded in count, name length, and total bytes.
  // Oversized/non-string values keep the existing drop (not reject) contract.
  const callerHeaders: Record<string, string> = {};
  if (payload.headers !== undefined) {
    if (
      payload.headers === null ||
      typeof payload.headers !== "object" ||
      Array.isArray(payload.headers)
    ) {
      return fail(400, "headers must be an object", host);
    }
    const entries = Object.entries(
      payload.headers as Record<string, unknown>
    );
    if (entries.length > MAX_HEADERS) {
      return fail(400, "too many headers", host);
    }
    let totalBytes = 0;
    for (const [k, v] of entries) {
      if (typeof k !== "string" || k.length === 0 || k.length > MAX_HEADER_NAME) {
        return fail(400, "bad header name", host);
      }
      if (typeof v !== "string" || v.length > MAX_HEADER_VALUE) continue;
      totalBytes += k.length + v.length;
      if (totalBytes > MAX_HEADERS_TOTAL) {
        return fail(413, "headers too large", host);
      }
      callerHeaders[k] = v;
    }
  }
  // Never let caller headers smuggle the secret path.
  for (const k of Object.keys(callerHeaders)) {
    if (STRIPPED_RESPONSE_HEADERS.has(k.toLowerCase())) {
      delete callerHeaders[k];
    }
  }

  let plaintext: string;
  try {
    plaintext = decryptSecret(secret.ciphertext);
  } catch {
    return fail(500, "decrypt failed", host);
  }

  let upstreamBody: string | undefined;
  if (secret.injectAs === "body") {
    if (typeof payload.body !== "string") {
      return fail(400, "body mode requires a JSON object body string", host);
    }
    if (payload.body.length > BODY_CAP) return fail(413, "body too large", host);
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(payload.body) as Record<string, unknown>;
    } catch {
      return fail(400, "body mode requires a JSON object", host);
    }
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
      return fail(400, "body mode requires a JSON object", host);
    }
    obj.secret = plaintext;
    upstreamBody = JSON.stringify(obj);
    callerHeaders["content-type"] = "application/json";
  } else {
    callerHeaders["authorization"] = `Bearer ${plaintext}`;
    if (typeof payload.body === "string") {
      if (payload.body.length > BODY_CAP) {
        return fail(413, "body too large", host);
      }
      upstreamBody = payload.body;
    }
  }
  plaintext = "";

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let upstream: Response;
  try {
    // Hostname URL: SNI/Host header/certificate validation all target the
    // allowlisted name (see H2 note at the top of this file).
    upstream = await fetch(target.toString(), {
      method,
      headers: callerHeaders,
      body: method === "GET" || method === "HEAD" ? undefined : upstreamBody,
      redirect: "manual",
      signal: ctrl.signal,
    });
  } catch {
    clearTimeout(timer);
    return fail(502, "upstream fetch failed", host);
  } finally {
    clearTimeout(timer);
  }

  // H2: re-resolve AFTER the call and abort on any mismatch — the record
  // must be stable and public across both resolutions for the response to
  // be returned. (Literal IPs have no DNS to race, so nothing to re-check.)
  if (!literal) {
    try {
      const repinned = await resolvePublicAddrs(host);
      if (repinned.join(",") !== (pinned ?? []).join(",")) {
        try {
          await upstream.body?.cancel();
        } catch {
          // best effort; the response is discarded either way
        }
        return fail(403, "dns revalidation failed", host);
      }
    } catch {
      try {
        await upstream.body?.cancel();
      } catch {
        // best effort; the response is discarded either way
      }
      return fail(403, "dns revalidation failed", host);
    }
  }

  const outHeaders: Record<string, string> = {};
  upstream.headers.forEach((v, k) => {
    if (!STRIPPED_RESPONSE_HEADERS.has(k.toLowerCase())) outHeaders[k] = v;
  });
  const text = await upstream.text();
  const status = `ok:${upstream.status}`;

  await db.insert(auditLogs).values({
    id: randomUUID(),
    actorUserId: userId,
    action: "proxy",
    targetType: "vault_secret",
    targetId: secretId,
    targetHost: host,
    status,
  });
  await db
    .update(vaultSecrets)
    .set({ lastUsedAt: new Date() })
    .where(and(eq(vaultSecrets.id, secretId), eq(vaultSecrets.userId, userId)));

  return Response.json({
    status: upstream.status,
    headers: outHeaders,
    body: text.slice(0, BODY_CAP),
  });
}
