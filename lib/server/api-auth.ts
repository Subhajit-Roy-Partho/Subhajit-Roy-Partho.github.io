import "server-only";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";

// Resolve the caller to a user id via session cookie OR Bearer API key.
// Returns null when unauthenticated.
// TODO: reconcile with @better-auth/api-key verify docs if method names
// drift; the `as any` casts keep tsc/build green across plugin versions.
export async function resolveUserId(req: Request): Promise<string | null> {
  // 1) Session cookie.
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (session?.user?.id) return session.user.id;
  } catch {
    // fall through to Bearer check
  }

  // 2) Bearer API key.
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
      const uid = res?.key?.userId ?? res?.user?.id ?? res?.userId;
      if (typeof uid === "string" && uid) return uid;
    }
    // Fallback: getSession with explicit bearer header.
    if (typeof api.getSession === "function") {
      const session = (await api.getSession({
        headers: new Headers({ authorization: `Bearer ${token}` }),
      } as never)) as unknown as { user?: { id?: unknown } } | null;
      if (session?.user?.id && typeof session.user.id === "string") {
        return session.user.id;
      }
    }
  } catch {
    return null;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => Promise<any>;

export function unauthorized() {
  return Response.json({ error: "unauthorized" }, { status: 401 });
}
