"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import {
  AccountHeader,
  btnDanger,
  btnGhost,
  btnPrimary,
  Card,
  errorClass,
  fieldClass,
  labelClass,
  noteClass,
} from "@/components/account-ui";

type KeyRow = {
  id: string;
  name: string;
  createdAt?: string | null;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
};

function normalizeKeys(input: unknown): KeyRow[] {
  if (!Array.isArray(input)) return [];
  return input.map((k) => {
    const r = k as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v : undefined);
    return {
      id: str(r.id) ?? str(r.keyId) ?? str(r.key) ?? "unknown",
      name: str(r.name) ?? "Untitled key",
      createdAt: str(r.createdAt) ?? null,
      expiresAt: str(r.expiresAt) ?? null,
      lastUsedAt: str(r.lastUsedAt) ?? str(r.lastRequest) ?? null,
    };
  });
}

function findRawKey(json: unknown): string | null {
  if (json && typeof json === "object") {
    const r = json as Record<string, unknown>;
    if (typeof r.key === "string") return r.key;
    if (r.data && typeof r.data === "object") {
      const d = r.data as Record<string, unknown>;
      if (typeof d.key === "string") return d.key;
    }
  }
  return null;
}

export function KeysClient() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();

  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [freshRaw, setFreshRaw] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/keys");
      if (res.status === 401) {
        router.push("/sign-in");
        return;
      }
      const json = (await res.json()) as { keys?: unknown; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load keys.");
      setKeys(normalizeKeys(json.keys));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load keys.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!sessionPending && !session?.user) {
      router.push("/sign-in");
      return;
    }
    if (session?.user) void load();
  }, [sessionPending, session, router, load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setFreshKey(null);
    setFreshRaw(null);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "default" }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Create failed.");
      const raw = findRawKey(json);
      setFreshKey(raw);
      setFreshRaw(JSON.stringify(json, null, 2));
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setCreating(false);
    }
  }

  async function remove(id: string, keyName: string) {
    if (!window.confirm(`Delete API key "${keyName}"? Calls using it will stop working.`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/keys/${encodeURIComponent(id)}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Delete failed.");
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  async function copyFresh() {
    if (!freshKey) return;
    try {
      await navigator.clipboard.writeText(freshKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — key is still visible above */
    }
  }

  if (sessionPending || (!session?.user && loading)) {
    return (
      <div className="pt-32">
        <section className="container-page section pt-0">
          <p className={noteClass}>Loading your API keys…</p>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-32">
      <section className="container-page section pt-0">
        <AccountHeader
          eyebrow="API keys"
          title="Keys for scripts and services."
          lede="Create a key, copy it once, and use it as a Bearer token against the vault and proxy APIs. Only metadata is ever listed — raw values are shown exactly once, at creation."
        />

        {error && <p className={`${errorClass} mt-8`}>{error}</p>}

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)]">
          <Card>
            <h2 className="font-display text-lg font-semibold">New key</h2>
            <form onSubmit={create} className="mt-5 space-y-4">
              <div>
                <label className={labelClass} htmlFor="key-name">Name</label>
                <input
                  id="key-name"
                  className={fieldClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="laptop-script"
                />
              </div>
              <button type="submit" disabled={creating} className={btnPrimary}>
                {creating ? "Creating…" : "Create key"}
              </button>
              <p className={`${noteClass} mt-2`}>
                Minting needs a signed-in browser session — API keys
                can&apos;t create or delete keys. Keys skip the two-factor
                challenge when used, so treat them like passwords; new keys
                expire after 90 days.
              </p>
            </form>

            {freshRaw && (
              <div className="mt-6 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-4">
                <p className={labelClass}>Shown once — copy it now</p>
                {freshKey ? (
                  <>
                    <p className="break-all font-mono text-sm">{freshKey}</p>
                    <button type="button" onClick={copyFresh} className={`${btnGhost} mt-3`}>
                      {copied ? "Copied ✓" : "Copy key"}
                    </button>
                  </>
                ) : (
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-xs">
                    {freshRaw}
                  </pre>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => { setFreshKey(null); setFreshRaw(null); }}
                    className={`${btnGhost} mt-3`}
                  >
                    I saved it — dismiss
                  </button>
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-4">
            {loading ? (
              <p className={noteClass}>Loading keys…</p>
            ) : keys.length === 0 ? (
              <Card>
                <p className={noteClass}>
                  No keys yet. Create one to call the API from scripts and services.
                </p>
              </Card>
            ) : (
              keys.map((k) => (
                <Card key={k.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-semibold">{k.name}</h3>
                      <p className="mt-1 break-all font-mono text-xs text-[var(--muted)]">{k.id}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {k.createdAt && <span className="chip">created {new Date(k.createdAt).toLocaleDateString()}</span>}
                        {k.expiresAt && <span className="chip">expires {new Date(k.expiresAt).toLocaleDateString()}</span>}
                        {k.lastUsedAt && <span className="chip">last used {new Date(k.lastUsedAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(k.id, k.name)}
                      className={btnDanger}
                    >
                      Delete
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
