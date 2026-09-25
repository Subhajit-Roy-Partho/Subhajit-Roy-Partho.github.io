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

type SecretMeta = {
  id: string;
  name: string;
  allowedHosts: string[] | null;
  injectAs: string;
  preview: string;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProxyResult = {
  status: number;
  headers: Record<string, string>;
  body: string;
};

type ExactGroupUI = {
  keepId: string;
  keepName: string;
  dropIds: string[];
  names: string[];
  preview: string;
};

type NearGroupUI = {
  ids: string[];
  names: string[];
  matchedOn: string[];
  suggestion: string;
  preview: string;
};

type DedupeResultUI = {
  exact: ExactGroupUI[];
  near: NearGroupUI[];
  deletedCount?: number;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function hostsToInput(hosts: string[] | null): string {
  return hosts ? hosts.join(", ") : "";
}

function inputToHosts(raw: string): string[] | null {
  const list = raw
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return list.length > 0 ? list : null;
}

export function VaultClient() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();

  const [secrets, setSecrets] = useState<SecretMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Create form
  const [cName, setCName] = useState("");
  const [cValue, setCValue] = useState("");
  const [cHosts, setCHosts] = useState("");
  const [cInject, setCInject] = useState<"header" | "body">("header");
  const [creating, setCreating] = useState(false);

  // Reveal state: id -> plaintext (kept in memory only, never persisted)
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealing, setRevealing] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eName, setEName] = useState("");
  const [eValue, setEValue] = useState("");
  const [eHosts, setEHosts] = useState("");
  const [eInject, setEInject] = useState<"header" | "body">("header");
  const [saving, setSaving] = useState(false);

  // Proxy test state (one panel open at a time)
  const [proxyId, setProxyId] = useState<string | null>(null);  const [pUrl, setPUrl] = useState("");
  const [pMethod, setPMethod] = useState("GET");
  const [pBody, setPBody] = useState("");
  const [pBusy, setPBusy] = useState(false);
  const [pResult, setPResult] = useState<ProxyResult | null>(null);
  const [pError, setPError] = useState<string | null>(null);

  // On-demand duplicate scan (never runs on write — only when asked).
  const [dedupe, setDedupe] = useState<DedupeResultUI | null>(null);
  const [scanning, setScanning] = useState(false);
  const [pruning, setPruning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vault");
      if (res.status === 401) {
        router.push("/sign-in");
        return;
      }
      const json = (await res.json()) as { secrets?: SecretMeta[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to load secrets.");
      setSecrets(json.secrets ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load secrets.");
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
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: cName.trim(),
          value: cValue,
          allowedHosts: inputToHosts(cHosts),
          injectAs: cInject,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Create failed.");
      setCName("");
      setCValue("");
      setCHosts("");
      setCInject("header");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setCreating(false);
    }
  }

  async function reveal(id: string) {
    if (revealed[id]) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    setRevealing(id);
    try {
      const res = await fetch(`/api/vault/${id}?reveal=1`);
      const json = (await res.json()) as { value?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Reveal failed.");
      setRevealed((prev) => ({ ...prev, [id]: json.value ?? "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reveal failed.");
    } finally {
      setRevealing(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete secret "${name}"? This cannot be undone.`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/vault/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Delete failed.");
      setSecrets((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  function startEdit(s: SecretMeta) {
    setEditingId(s.id);
    setEName(s.name);
    setEValue("");
    setEHosts(hostsToInput(s.allowedHosts));
    setEInject(s.injectAs === "body" ? "body" : "header");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError(null);
    try {
      const patch: Record<string, unknown> = {
        name: eName.trim(),
        allowedHosts: inputToHosts(eHosts),
        injectAs: eInject,
      };
      if (eValue) patch.value = eValue;
      const res = await fetch(`/api/vault/${editingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Update failed.");
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function proxyTest(e: React.FormEvent) {
    e.preventDefault();
    if (!proxyId) return;
    setPBusy(true);
    setPError(null);
    setPResult(null);
    try {
      const res = await fetch(`/api/proxy/${proxyId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: pUrl.trim(),
          method: pMethod,
          ...(pBody ? { body: pBody } : {}),
        }),
      });
      const json = (await res.json()) as ProxyResult & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Proxy request failed.");
      setPResult({ status: json.status, headers: json.headers, body: json.body });
    } catch (err) {
      setPError(err instanceof Error ? err.message : "Proxy request failed.");
    } finally {
      setPBusy(false);
    }
  }

  async function copy(id: string, text: string) {
    if (await copyText(text)) {
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    }
  }

  async function scanDuplicates() {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/vault/dedupe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "scan" }),
      });
      const json = (await res.json()) as DedupeResultUI & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Duplicate scan failed.");
      setDedupe({ exact: json.exact ?? [], near: json.near ?? [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Duplicate scan failed.");
    } finally {
      setScanning(false);
    }
  }

  async function pruneDuplicates() {
    if (
      !window.confirm(
        "Delete exact duplicate secrets? The oldest copy of each group is kept. Near-duplicates are never auto-deleted."
      )
    )
      return;
    setPruning(true);
    setError(null);
    try {
      const res = await fetch("/api/vault/dedupe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode: "prune" }),
      });
      const json = (await res.json()) as DedupeResultUI & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Prune failed.");
      setDedupe({
        exact: json.exact ?? [],
        near: json.near ?? [],
        deletedCount: json.deletedCount ?? 0,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prune failed.");
    } finally {
      setPruning(false);
    }
  }

  if (sessionPending || (!session?.user && loading)) {
    return (
      <div className="pt-32">
        <section className="container-page section pt-0">
          <p className={noteClass}>Loading your vault…</p>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-32">
      <section className="container-page section pt-0">
        <AccountHeader
          eyebrow="Secret vault"
          title="Keys, tokens, and hidden strings."
          lede="Values are encrypted at rest. The list only ever shows a masked preview — reveal a value when you need it, and it never leaves your screen except through the proxied upstream."
        />

        {error && <p className={`${errorClass} mt-8`}>{error}</p>}

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Duplicates</h2>
              <p className={noteClass}>
                On-demand only — nothing is checked on write. Scan finds exact
                copies and near-matches; only exact copies can be pruned, and
                near-matches are always merged manually via Edit/Delete.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void scanDuplicates()}
              disabled={scanning}
              className={btnGhost}
            >
              {scanning ? "Scanning…" : "Find duplicates"}
            </button>
          </div>

          {dedupe && (
            <div className="mt-4 space-y-4">
              {dedupe.deletedCount !== undefined && (
                <p className={noteClass}>
                  Pruned {dedupe.deletedCount} exact duplicate
                  {dedupe.deletedCount === 1 ? "" : "s"} (oldest copy kept).
                </p>
              )}
              {dedupe.exact.length === 0 && dedupe.near.length === 0 ? (
                <p className={noteClass}>No duplicates found.</p>
              ) : (
                <>
                  {dedupe.exact.map((g) => (
                    <div
                      key={g.keepId}
                      className="rounded-xl border border-[var(--border)] p-4"
                    >
                      <p className="text-sm font-semibold">
                        Exact duplicate: {g.keepName}
                      </p>
                      <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                        keep {g.keepId} · drop {g.dropIds.length} · preview:{" "}
                        {g.preview}
                      </p>
                      <button
                        type="button"
                        onClick={() => void pruneDuplicates()}
                        disabled={pruning}
                        className={`${btnDanger} mt-3`}
                      >
                        {pruning ? "Deleting…" : "Delete duplicates"}
                      </button>
                    </div>
                  ))}
                  {dedupe.near.map((g) => (
                    <div
                      key={g.ids.join("+")}
                      className="rounded-xl border border-[var(--border)] p-4"
                    >
                      <p className="text-sm font-semibold">
                        Near-duplicate: {g.names.join(", ")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {g.matchedOn.map((m) => (
                          <span key={m} className="chip font-mono">
                            {m}
                          </span>
                        ))}
                      </div>
                      <p className={`${noteClass} mt-2`}>
                        {g.suggestion} Merge manually with Edit/Delete — these
                        are never auto-deleted.
                      </p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </Card>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Create */}
          <Card>
            <h2 className="font-display text-lg font-semibold">New secret</h2>
            <form onSubmit={create} className="mt-5 space-y-4">
              <div>
                <label className={labelClass} htmlFor="vault-name">Name</label>
                <input
                  id="vault-name"
                  className={fieldClass}
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="stripe-test-key"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="vault-value">Value</label>
                <textarea
                  id="vault-value"
                  className={`${fieldClass} font-mono`}
                  required
                  rows={3}
                  value={cValue}
                  onChange={(e) => setCValue(e.target.value)}
                  placeholder="sk_test_…"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="vault-hosts">
                  Allowed hosts <span className="normal-case tracking-normal">(comma-separated, required for proxy)</span>
                </label>
                <input
                  id="vault-hosts"
                  className={`${fieldClass} font-mono`}
                  value={cHosts}
                  onChange={(e) => setCHosts(e.target.value)}
                  placeholder="api.stripe.com, api.github.com"
                />
                <p className={`${noteClass} mt-2`}>
                  Only allowlist hosts you trust with this secret&apos;s value —
                  anyone able to call the proxy can make the server send the
                  secret to any host listed here.
                </p>
              </div>
              <div>
                <label className={labelClass} htmlFor="vault-inject">Inject as</label>
                <select
                  id="vault-inject"
                  className={fieldClass}
                  value={cInject}
                  onChange={(e) => setCInject(e.target.value === "body" ? "body" : "header")}
                >
                  <option value="header">Authorization header (Bearer)</option>
                  <option value="body">JSON body field (secret)</option>
                </select>
              </div>
              <button type="submit" disabled={creating} className={btnPrimary}>
                {creating ? "Encrypting…" : "Store secret"}
              </button>
            </form>
          </Card>

          {/* List */}
          <div className="space-y-4">
            {loading ? (
              <p className={noteClass}>Loading secrets…</p>
            ) : secrets.length === 0 ? (
              <Card>
                <p className={noteClass}>
                  No secrets yet. Store your first one — it will appear here with a masked preview.
                </p>
              </Card>
            ) : (
              secrets.map((s) => (
                <Card key={s.id}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-base font-semibold">{s.name}</h3>
                      <p className="mt-1 font-mono text-xs text-[var(--muted)]">
                        preview: {s.preview}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="chip">{s.injectAs}</span>
                        {s.allowedHosts ? (
                          s.allowedHosts.map((h) => (
                            <span key={h} className="chip font-mono">{h}</span>
                          ))
                        ) : (
                          <span className="chip">proxy disabled</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => reveal(s.id)}
                        disabled={revealing === s.id}
                        className={btnGhost}
                      >
                        {revealing === s.id
                          ? "…"
                          : revealed[s.id] !== undefined
                            ? "Hide"
                            : "Reveal"}
                      </button>
                      <button type="button" onClick={() => startEdit(s)} className={btnGhost}>
                        Edit
                      </button>
                      <button type="button" onClick={() => remove(s.id, s.name)} className={btnDanger}>
                        Delete
                      </button>
                    </div>
                  </div>

                  {revealed[s.id] !== undefined && (
                    <div className="mt-4 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-4">
                      <p className={labelClass}>Revealed value — handle with care</p>
                      <p className="break-all font-mono text-sm">{revealed[s.id]}</p>
                      <button
                        type="button"
                        onClick={() => copy(`reveal-${s.id}`, revealed[s.id])}
                        className={`${btnGhost} mt-3`}
                      >
                        {copied === `reveal-${s.id}` ? "Copied ✓" : "Copy value"}
                      </button>
                    </div>
                  )}

                  {editingId === s.id && (
                    <form onSubmit={saveEdit} className="mt-4 space-y-4 border-t border-[var(--border)] pt-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelClass}>Name</label>
                          <input
                            className={fieldClass}
                            required
                            value={eName}
                            onChange={(e) => setEName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Inject as</label>
                          <select
                            className={fieldClass}
                            value={eInject}
                            onChange={(e) => setEInject(e.target.value === "body" ? "body" : "header")}
                          >
                            <option value="header">Authorization header</option>
                            <option value="body">JSON body field</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>
                          New value <span className="normal-case tracking-normal">(leave blank to keep)</span>
                        </label>
                        <textarea
                          className={`${fieldClass} font-mono`}
                          rows={2}
                          value={eValue}
                          onChange={(e) => setEValue(e.target.value)}
                          placeholder="Leave blank to keep the current value"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Allowed hosts (comma-separated)</label>
                        <input
                          className={`${fieldClass} font-mono`}
                          value={eHosts}
                          onChange={(e) => setEHosts(e.target.value)}
                          placeholder="api.example.com"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={saving} className={btnPrimary}>
                          {saving ? "Saving…" : "Save changes"}
                        </button>
                        <button type="button" onClick={() => setEditingId(null)} className={btnGhost}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Proxy test */}
                  <div className="mt-4 border-t border-[var(--border)] pt-4">
                    {proxyId === s.id ? (
                      <form onSubmit={proxyTest} className="space-y-3">
                        <p className={labelClass}>Proxy test — secret is injected server-side, never shown</p>
                        <p className={noteClass}>
                          Trusted-hosts warning: the proxy will send this secret
                          to any of its allowed hosts. Only test URLs on hosts
                          you trust with the value; targets must be public
                          https hosts (private/loopback/reserved ranges are
                          rejected).
                        </p>
                        <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                          <input
                            className={`${fieldClass} font-mono`}
                            required
                            value={pUrl}
                            onChange={(e) => setPUrl(e.target.value)}
                            placeholder="https://api.example.com/v1/me"
                          />
                          <select
                            className={fieldClass}
                            value={pMethod}
                            onChange={(e) => setPMethod(e.target.value)}
                          >
                            {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>
                        <textarea
                          className={`${fieldClass} font-mono`}
                          rows={2}
                          value={pBody}
                          onChange={(e) => setPBody(e.target.value)}
                          placeholder='Optional body, e.g. {"hello":"world"}'
                        />
                        <div className="flex flex-wrap gap-2">
                          <button type="submit" disabled={pBusy} className={btnPrimary}>
                            {pBusy ? "Calling…" : "Send via proxy"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setProxyId(null); setPResult(null); setPError(null); }}
                            className={btnGhost}
                          >
                            Close
                          </button>
                        </div>
                        {pError && <p className={errorClass}>{pError}</p>}
                        {pResult && (
                          <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm">
                            <p className="font-mono">status: {pResult.status}</p>
                            <p className="mt-2 font-mono text-xs text-[var(--muted)]">
                              headers: {JSON.stringify(pResult.headers)}
                            </p>
                            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all font-mono text-xs">
                              {pResult.body}
                            </pre>
                          </div>
                        )}
                      </form>
                    ) : (
                      <button
                        type="button"
                        disabled={!s.allowedHosts}
                        title={s.allowedHosts ? "Test this secret against an allowed host" : "Set allowed hosts to enable proxying"}
                        onClick={() => {
                          setProxyId(s.id);
                          setPResult(null);
                          setPError(null);
                          setPUrl(s.allowedHosts?.[0] ? `https://${s.allowedHosts[0]}/` : "");
                        }}
                        className={btnGhost}
                      >
                        Test via proxy →
                      </button>
                    )}
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
