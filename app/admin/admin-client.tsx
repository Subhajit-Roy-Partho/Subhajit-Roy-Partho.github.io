"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import {
  AccountHeader,
  btnDanger,
  btnGhost,
  Card,
  errorClass,
  noteClass,
} from "@/components/account-ui";

type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  banned?: boolean | null;
  createdAt?: string | null;
};

function normalizeUsers(input: unknown): AdminUser[] {
  if (!Array.isArray(input)) return [];
  return input.map((u) => {
    const r = u as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v : undefined);
    return {
      id: str(r.id) ?? "unknown",
      email: str(r.email) ?? "—",
      name: typeof r.name === "string" ? r.name : null,
      role: typeof r.role === "string" ? r.role : null,
      banned: typeof r.banned === "boolean" ? r.banned : null,
      createdAt: typeof r.createdAt === "string" ? r.createdAt : null,
    };
  });
}

function extractUsers(res: unknown): AdminUser[] {
  if (res && typeof res === "object") {
    const r = res as Record<string, unknown>;
    const data = r.data as Record<string, unknown> | undefined;
    if (data && Array.isArray(data.users)) return normalizeUsers(data.users);
    if (Array.isArray(r.users)) return normalizeUsers(r.users);
  }
  return [];
}

function messageOf(res: unknown): string | null {
  if (res && typeof res === "object" && "error" in res) {
    const err = (res as { error?: { message?: unknown } | null }).error;
    if (err && typeof err.message === "string" && err.message) return err.message;
    if (err) return "Request failed.";
  }
  return null;
}

export function AdminClient() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const myRole = (session?.user as { role?: string } | undefined)?.role;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authClient.admin.listUsers({
        query: { limit: 100 },
      });
      const msg = messageOf(res);
      if (msg) throw new Error(msg);
      setUsers(extractUsers(res));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sessionPending && !session?.user) {
      router.push("/sign-in");
      return;
    }
    if (session?.user) void load();
  }, [sessionPending, session, router, load]);

  async function run(id: string, fn: () => Promise<unknown>) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fn();
      const msg = messageOf(res);
      if (msg) throw new Error(msg);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusyId(null);
    }
  }

  const setRole = (id: string, role: "admin" | "user") =>
    run(`${id}-role`, () => authClient.admin.setRole({ userId: id, role }));

  const ban = (id: string) =>
    run(`${id}-ban`, () => authClient.admin.banUser({ userId: id }));

  const unban = (id: string) =>
    run(`${id}-ban`, () => authClient.admin.unbanUser({ userId: id }));

  if (sessionPending) {
    return (
      <div className="pt-32">
        <section className="container-page section pt-0">
          <p className={noteClass}>Checking permissions…</p>
        </section>
      </div>
    );
  }

  if (myRole !== "admin") {
    return (
      <div className="pt-32">
        <section className="container-page section pt-0">
          <AccountHeader
            eyebrow="Admin"
            title="Admins only."
            lede="Your account doesn't have the admin role, so there's nothing to show here."
          />
          <Card className="mx-auto mt-10 max-w-md text-center">
            <p className={noteClass}>
              If you should be an admin, ask an existing admin to promote your account.
            </p>
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-32">
      <section className="container-page section pt-0">
        <AccountHeader
          eyebrow="Admin"
          title="Users and roles."
          lede="Promote trusted accounts, or ban accounts that abuse the vault and proxy. Bans take effect immediately."
        />

        {error && <p className={`${errorClass} mt-8`}>{error}</p>}

        <div className="mt-10 space-y-4">
          {loading ? (
            <p className={noteClass}>Loading users…</p>
          ) : users.length === 0 ? (
            <Card>
              <p className={noteClass}>No users found.</p>
            </Card>
          ) : (
            users.map((u) => {
              const busy = busyId?.startsWith(u.id) ?? false;
              return (
                <Card key={u.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-display truncate text-base font-semibold">
                        {u.name ?? u.email}
                      </h3>
                      <p className="mt-0.5 break-all text-sm text-[var(--muted)]">{u.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="chip">{u.role ?? "user"}</span>
                        {u.banned ? (
                          <span className="chip !border-red-500/40 !text-red-300">banned</span>
                        ) : (
                          <span className="chip">active</span>
                        )}
                        {u.createdAt && (
                          <span className="chip">
                            joined {new Date(u.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {u.role === "admin" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setRole(u.id, "user")}
                          className={btnGhost}
                        >
                          Demote to user
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setRole(u.id, "admin")}
                          className={btnGhost}
                        >
                          Make admin
                        </button>
                      )}
                      {u.banned ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => unban(u.id)}
                          className={btnGhost}
                        >
                          {busy ? "…" : "Unban"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            if (window.confirm(`Ban ${u.email}? They will be signed out immediately.`)) {
                              void ban(u.id);
                            }
                          }}
                          className={btnDanger}
                        >
                          {busy ? "…" : "Ban"}
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
