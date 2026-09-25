// POST /api/proxy/:secretId — authenticated server-side fetch that injects
// the caller's vault secret upstream without ever exposing it to the browser.
//
// Contract (designer UI depends on this):
//   body: { url, method?, headers?, body? }
//   - url: https only; hostname must exactly match one of the secret's
//     allowedHosts (lowercased, max 10). Secrets with allowedHosts=null
//     cannot be proxied (proxy disabled).
//   - injectAs "header" (default): sets `Authorization: Bearer <secret>`
//     (overwrites any caller-supplied Authorization).
//   - injectAs "body": request body must be a JSON object (string); the
//     secret is merged in as the `secret` field.
//   - caller body cap: 1MB. Upstream timeout: 10s. Redirects: manual
//     (upstream 3xx is returned as-is, never followed).
//   - private/loopback/link-local targets are rejected (DNS-resolved).
//   - response: { status, headers, body (text, truncated at 1MB) }.
//     Secret-carrying headers are stripped from returned headers and the
//     secret is never echoed.
// Every call (success or failure) is written to audit_logs.

import { lookup } from "node:dns/promises";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { auditLogs, vaultSecrets } from "@/db/schema";
import { resolveUserId, unauthorized } from "@/lib/server/api-auth";
import { decryptSecret } from "@/lib/server/vault-crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const BODY_CAP = 1_000_000; // 1MB
const TIMEOUT_MS = 10_000;
const STRIPPED_RESPONSE_HEADERS = new Set([
  "authorization",
  "proxy-authorization",
  "x-vault-secret",
  "x-api-key",
  "api-key",
  "cookie",
  "set-cookie",
]);

function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return false;
  }
  if (p[0] === 10) return true; // 10/8
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true; // 172.16/12
  if (p[0] === 192 && p[1] === 168) return true; // 192.168/16
  if (p[0] === 127) return true; // 127/8
  if (p[0] === 169 && p[1] === 254) return true; // link-local (incl. 169.254.169.254)
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const n = ip.toLowerCase();
  if (n === "::1") return true;
  // fe80::/10 — first 10 bits 1111111010 → first hextet fe80..febf
  const first = n.split(":")[0];
  if (/^fe[89ab][0-9a-f]?$/i.test(first)) return true;
  return false;
}

async function hostResolvesPrivate(hostname: string): Promise<boolean> {
  // Literal IP fast-path.
  if (/^[0-9.]+$/.test(hostname)) return isPrivateIPv4(hostname);
  if (hostname.includes(":")) return isPrivateIPv6(hostname);
  let addrs: Array<{ address: string }>;
  try {
    addrs = await lookup(hostname, { all: true });
  } catch {
    throw new Error("dns resolution failed");
  }
  return addrs.some((a) =>
    a.address.includes(":")
      ? isPrivateIPv6(a.address)
      : isPrivateIPv4(a.address)
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ secretId: string }> }
) {
  const userId = await resolveUserId(req);
  if (!userId) return unauthorized();
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

  let payload: {
    url?: unknown;
    method?: unknown;
    headers?: unknown;
    body?: unknown;
  };
  try {
    payload = await req.json();
  } catch {
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

  const host = target.hostname.toLowerCase();
  const allowed: string[] | null = secret.allowedHostsJson
    ? (JSON.parse(secret.allowedHostsJson) as string[])
    : null;
  if (!allowed || !allowed.includes(host)) {
    return fail(403, "host not allowed", host);
  }

  try {
    if (await hostResolvesPrivate(host)) {
      return fail(403, "private target rejected", host);
    }
  } catch {
    return fail(502, "dns failed", host);
  }

  const method =
    typeof payload.method === "string"
      ? payload.method.toUpperCase()
      : "GET";
  if (!["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].includes(method)) {
    return fail(400, "bad method", host);
  }

  const callerHeaders: Record<string, string> = {};
  if (payload.headers && typeof payload.headers === "object") {
    for (const [k, v] of Object.entries(
      payload.headers as Record<string, unknown>
    )) {
      if (typeof v === "string" && v.length < 16_384) callerHeaders[k] = v;
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
