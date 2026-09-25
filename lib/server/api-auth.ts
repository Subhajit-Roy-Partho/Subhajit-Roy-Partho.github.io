import "server-only";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";

// Caller is banned when banned=true with no expiry, or with an expiry still
// in the future. An expired ban no longer blocks (better-auth semantics).
async function isActiveUser(userId: string): Promise<boolean> {
  let rows: Array<{ banned: boolean | null; banExpires: Date | null }>;
  try {
    rows = await db
      .select({ banned: user.banned, banExpires: user.banExpires })
      .from(user)
      .where(eq(user.id, userId));
  } catch {
    // Fail closed: without the user row we cannot prove the caller isn't
    // banned. (Downstream route logic needs the DB anyway, so this only
    // turns a would-be 500 into a 401.)
    return false;
  }
  const u = rows[0];
  if (!u) return false;
  if (u.banned) {
    if (!u.banExpires) return false;
    const exp =
      u.banExpires instanceof Date
        ? u.banExpires.getTime()
        : Number(u.banExpires);
    if (!Number.isFinite(exp) || exp > Date.now()) return false;
  }
  return true;
}

// Resolve the caller to a user id via session cookie OR Bearer API key.
// Returns null when unauthenticated — including when the account is banned
// or ban-expired-pending (H4: the Bearer path must not bypass bans).
// TODO: reconcile with @better-auth/api-key verify docs if method names
// drift; the `as any` casts keep tsc/build green across plugin versions.
export async function resolveUserId(req: Request): Promise<string | null> {
  let uid: string | null = null;

  // 1) Session cookie.
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) uid = session.user.id;
  } catch {
    // fall through to Bearer check
  }

  // 2) Bearer API key.
  if (!uid) {
    const raw = req.headers.get("authorization");
    const token =
      raw?.startsWith("Bearer ") ? raw.slice("Bearer ".length).trim() : null;
    if (!token) return null;

    try {
      const api = auth.api as unknown as Record<string, AnyFn>;
      // Preferred: verifyApiKey({ body: { key } })
      if (typeof api.verifyApiKey === "function") {
        const res = (await api.verifyApiKey({
          body: { key: token },
        } as never)) as unknown as {
          key?: { userId?: unknown };
          user?: { id?: unknown };
          userId?: unknown;
        } | null;
        const found = res?.key?.userId ?? res?.user?.id ?? res?.userId;
        if (typeof found === "string" && found) uid = found;
      } else if (typeof api.getSession === "function") {
        // Fallback: getSession with explicit bearer header.
        const session = (await api.getSession({
          headers: new Headers({ authorization: `Bearer ${token}` }),
        } as never)) as unknown as { user?: { id?: unknown } } | null;
        if (session?.user?.id && typeof session.user.id === "string") {
          uid = session.user.id;
        }
      }
    } catch {
      return null;
    }
    if (!uid) return null;
  }

  // H4: bans apply to both paths — a banned user's keys stop working here.
  if (!(await isActiveUser(uid))) return null;
  return uid;
}

// Session-cookie ONLY (no Bearer): for minting/deleting API keys (H3).
// The apiKey plugin never mints a session for key holders
// (enableSessionForAPIKeys defaults to false), so getSession via cookies
// cannot be satisfied by a Bearer key — keys can't mint keys.
export async function requireSessionUserId(): Promise<string | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const uid = session?.user?.id;
    if (typeof uid !== "string" || !uid) return null;
    if (!(await isActiveUser(uid))) return null;
    return uid;
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => Promise<any>;

export function unauthorized() {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}
