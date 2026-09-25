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
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const myRole = (session?.user as { role?: string } | undefined)?.role;
  const myId = (session?.user as { id?: string } | undefined)?.id;
  const adminCount = users.filter((u) => u.role === "admin").length;

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

  const setRole = (id: string, role: "admin" | "user") => {
    // L1: never demote yourself, and never demote the last admin — both
    // would leave the deployment unadministrable (or lock you out mid-click).
    if (id === myId && role !== "admin") {
      setError("You can't demote your own account.");
      return;
    }
    if (role !== "admin" && adminCount <= 1) {
      setError("Refusing: that's the last admin account.");
      return;
    }
    void run(`${id}-role`, () => authClient.admin.setRole({ userId: id, role }));
  };

  // H4: a ban must also kill the account's Bearer keys — banning alone
  // leaves rows in the plugin-owned apikey table. The server additionally
  // rejects banned users in api-auth, but revoke here for hygiene.
  const ban = async (id: string, email: string) => {
    if (id === myId) {
      setError("You can't ban your own account.");
      return;
    }
    setBusyId(`${id}-ban`);
    setError(null);
    setNotice(null);
    try {
      const res = await authClient.admin.banUser({ userId: id });
      const msg = messageOf(res);
      if (msg) throw new Error(msg);
      let revoked: number | null = null;
      try {
        const rk = await fetch(
          `/api/admin/users/${encodeURIComponent(id)}/keys`,
          { method: "DELETE" }
        );
        const kj = (await rk.json()) as { revoked?: unknown };
        if (rk.ok && typeof kj.revoked === "number") revoked = kj.revoked;
      } catch {
        // ban already landed; surface revocation as best-effort below
      }
      setNotice(
        revoked === null
          ? `Banned ${email}. Key revocation status unknown — check their keys.`
          : `Banned ${email}; revoked ${revoked} API key(s).`
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusyId(null);
    }
  };

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
        {notice && <p className={`${noteClass} mt-8`}>{notice}</p>}

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
              const isSelf = myId !== undefined && u.id === myId;
              const soleAdmin = u.role === "admin" && adminCount <= 1;
              const demoteBlocked = isSelf || soleAdmin;
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
                          disabled={busy || demoteBlocked}
                          title={
                            isSelf
                              ? "You can't demote your own account"
                              : soleAdmin
                                ? "Can't demote the last admin"
                                : undefined
                          }
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
                          disabled={busy || isSelf}
                          title={isSelf ? "You can't ban your own account" : undefined}
                          onClick={() => {
                            if (window.confirm(`Ban ${u.email}? They will be signed out immediately.`)) {
                              void ban(u.id, u.email);
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
