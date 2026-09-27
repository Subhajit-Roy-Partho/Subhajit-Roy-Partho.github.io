#!/usr/bin/env node
// site-vault — PC CLI for the per-user vault API.
//
//   login | list | get | push | push-env-file | delete | proxy | mint
//
// Auth: Bearer API key (created on the site's /keys page, or minted via
// `site-vault mint`). Session cookies are a browser concern EXCEPT for
// `mint`, which signs in with email+password to capture a session cookie
// in memory, then POSTs /api/keys with it. Bearer keys can never mint
// keys (server requires a signed-in session), by design.
// Secrets are NEVER logged: list/get print the server's masked preview only.
// The exceptions are `get <name> --reveal` and `mint`, which print the raw
// value/key to stdout (pipe-friendly) and nothing else on stdout.
//
// Config: ~/.config/site-vault/config.json  { url, apiKey }  (mode 600)
// Runtime: node >= 18 (global fetch). No npm dependencies.

import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const CONFIG_PATH = join(homedir(), ".config", "site-vault", "config.json");

// ---------------------------------------------------------------------------
// config
// ---------------------------------------------------------------------------

function loadConfig() {
  if (!existsSync(CONFIG_PATH)) {
    fail(
      `not logged in (no ${CONFIG_PATH}).\nRun: site-vault login --url <site> --api-key-stdin (or --api-key-env <VAR>)`
    );
  }
  try {
    const cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    if (!cfg.url || !cfg.apiKey) throw new Error("bad config");
    return { url: String(cfg.url).replace(/\/+$/, ""), apiKey: String(cfg.apiKey) };
  } catch {
    fail(`config at ${CONFIG_PATH} is unreadable. Re-run login.`);
  }
}

function saveConfig(url, apiKey) {
  mkdirSync(join(homedir(), ".config", "site-vault"), { recursive: true, mode: 0o700 });
  writeFileSync(CONFIG_PATH, JSON.stringify({ url, apiKey }, null, 2) + "\n", { mode: 0o600 });
  try {
    chmodSync(CONFIG_PATH, 0o600);
  } catch {
    // best effort; writeFileSync already applied the mode on creation
  }
}

// ---------------------------------------------------------------------------
// http
// ---------------------------------------------------------------------------

async function api(cfg, path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(cfg.url + path, {
      method,
      headers: {
        authorization: `Bearer ${cfg.apiKey}`,
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    fail(`request failed: ${e.message} (is the site URL correct?)`);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON (e.g. upstream proxy passthrough is still JSON; be tolerant)
  }
  if (!res.ok) {
    const msg = data?.error ?? `HTTP ${res.status}`;
    fail(msg, 1);
  }
  return data;
}

async function resolveByName(cfg, name) {
  const data = await api(cfg, "/api/vault");
  const hit = (data.secrets ?? []).find((s) => s.name === name);
  if (!hit) fail(`secret "${name}" not found.`);
  return hit;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function fail(message, code = 1) {
  console.error(`site-vault: error: ${message}`);
  process.exit(code);
}

function usageFail(message) {
  console.error(`site-vault: ${message}\nRun: site-vault --help`);
  process.exit(2);
}

/** Parse ["--flag", "value", "--bool", ...] into { flags, positionals }. */
function parseArgs(argv) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--") {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq !== -1) {
        flags[a.slice(2, eq)] = a.slice(eq + 1);
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
        flags[a.slice(2)] = argv[++i];
      } else {
        flags[a.slice(2)] = true;
      }
    } else {
      positionals.push(a);
    }
  }
  return { flags, positionals };
}

function parseHosts(raw) {
  if (raw === undefined) return undefined;
  return String(raw)
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

function parseInject(raw) {
  if (raw === undefined) return undefined;
  if (raw !== "header" && raw !== "body") usageFail("--inject must be header|body");
  return raw;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data.replace(/\r?\n$/, "")));
    process.stdin.on("error", reject);
  });
}

async function resolveValue(flags) {
  const sources = ["value", "value-stdin", "env-key"].filter((k) => flags[k] !== undefined);
  if (sources.length === 0) {
    usageFail("push needs one of: --value <v> | --value-stdin | --env-key <KEY>");
  }
  if (sources.length > 1) usageFail(`push takes exactly one value source (got ${sources.join(", ")})`);
  if (flags.value !== undefined) {
    console.error("site-vault: warning: --value may persist in shell history; prefer --value-stdin or --env-key.");
    return String(flags.value);
  }
  if (flags["value-stdin"] !== undefined) return readStdin();
  const key = String(flags["env-key"]);
  const v = process.env[key];
  if (v === undefined || v === "") fail(`env var ${key} is unset or empty.`);
  return v;
}

function parseDescription(raw) {
  if (raw === undefined) return undefined;
  if (typeof raw === "boolean") usageFail("--description needs a value");
  const trimmed = String(raw).trim();
  if (trimmed.length > 500) fail("description too long (max 500 chars).");
  return trimmed ? trimmed : null;
}

/** Upsert one secret by name: POST, falling back to PATCH on 409. Never logs the value. */
async function upsert(cfg, name, value, { allowedHosts, injectAs, description } = {}) {
  const payload = { name, value };
  if (allowedHosts !== undefined) payload.allowedHosts = allowedHosts;
  if (injectAs !== undefined) payload.injectAs = injectAs;
  if (description !== undefined && description !== null) payload.description = description;

  let res;
  try {
    res = await fetch(cfg.url + "/api/vault", {
      method: "POST",
      headers: { authorization: `Bearer ${cfg.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    fail(`request failed: ${e.message}`);
  }
  if (res.status === 409) {
    const existing = await resolveByName(cfg, name);
    const patch = { value };
    if (allowedHosts !== undefined) patch.allowedHosts = allowedHosts;
    if (injectAs !== undefined) patch.injectAs = injectAs;
    if (description !== undefined) patch.description = description;
    await api(cfg, `/api/vault/${existing.id}`, { method: "PATCH", body: patch });
    return "updated";
  }
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      msg = (await res.json()).error ?? msg;
    } catch {
      // keep default
    }
    fail(msg);
  }
  return "created";
}

// Parse KEY=VALUE lines: skip blanks/comments/exports and lines without '='.
function parseEnvFile(text) {
  const entries = [];
  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("export ")) line = line.slice("export ".length).trim();
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || value === "") continue;
    entries.push({ key, value });
  }
  return entries;
}

// ---------------------------------------------------------------------------
// commands
// ---------------------------------------------------------------------------

const HELP = `site-vault — PC CLI for the per-user vault

Usage:
  site-vault login --url <site> (--api-key <key> | --api-key-stdin | --api-key-env <VAR>)
  site-vault list [--search <text>]
  site-vault get <name> [--reveal]
  site-vault push <name> (--value <v> | --value-stdin | --env-key <KEY>)
                        [--hosts h1,h2] [--inject header|body] [--description "..."]
  site-vault push-env-file <path> [--prefix <P>] [--allowlist K1,K2 | --all]
                         [--description "..." (applied to all)]
  site-vault delete <name>
  site-vault proxy <name> --url <target> [--method <M>] [--body-json '<json>']
  site-vault dedupe [--prune]
  site-vault mint --email <addr> [--url <site>] [--password-stdin] [--otp <code>]
                 [--name <key-name>] [--days <1-365>] [--save]

Notes:
  - Minting needs a signed-in session, not a Bearer key: 'mint' signs in
    with email+password (password via stdin only, never an arg, never
    stored — memory only), then POSTs /api/keys with the session cookie.
    Bearer keys can't mint keys, by design (no privilege-escalation loop).
    --url defaults to the saved login's site when omitted. The raw key is
    printed ONCE to stdout — save it now; it is never shown again. Only
    --save writes it to the config file.
  - Passwords/keys are never logged. Trailing-slash API URLs are used
    directly (the site sets trailingSlash:true, so slashless auth URLs
    308-redirect); fetch still follows redirects if one appears.
  - Two-factor: if sign-in answers with a 2FA challenge, re-run with the
    six-digit authenticator code as --otp.
  - Prefer 'login --api-key-stdin' or '--api-key-env <VAR>': a key passed as
    --api-key can linger in shell history. Same for secret values: prefer
    --value-stdin / --env-key over --value.
  - Values are never printed except by 'get --reveal' and 'mint' (raw value/key
    on stdout, nothing else on stdout). Everywhere else only the server's
    masked preview is shown.
  - push upserts: creates, or updates the value (409 -> PATCH) if <name> exists.
  - list --search <text> filters the already-listed metadata (name, description,
    allowedHosts; case-insensitive substring). Dedupe output is unaffected.
  - push-env-file never prints values; it reports names + created/updated counts.
  - proxy injects the secret server-side; the secret never touches this machine.
    Trusted-hosts warning: the server will send the secret to ANY of the
    secret's allowed hosts — only allowlist hosts you trust with the value.
  - dedupe is on-demand only (never on write): 'dedupe' scans for exact
    copies + near-matches (masked previews only); '--prune' deletes exact
    copies only, keeping the oldest — near-matches are merge-manually.
`;

async function resolveLoginKey(flags) {
  const sources = ["api-key", "api-key-stdin", "api-key-env"].filter(
    (k) => flags[k] !== undefined
  );
  if (sources.length === 0) {
    usageFail("login needs one of: --api-key <key> | --api-key-stdin | --api-key-env <VAR>");
  }
  if (sources.length > 1) {
    usageFail(`login takes exactly one key source (got ${sources.join(", ")})`);
  }
  if (flags["api-key"] !== undefined) {
    console.error(
      "site-vault: warning: --api-key may persist in shell history; prefer --api-key-stdin or --api-key-env."
    );
    return String(flags["api-key"]);
  }
  if (flags["api-key-stdin"] !== undefined) {
    const key = (await readStdin()).trim();
    if (!key) fail("empty key on stdin; nothing stored.");
    return key;
  }
  const varName = String(flags["api-key-env"]);
  const key = process.env[varName];
  if (!key) fail(`env var ${varName} is unset or empty.`);
  return key;
}

async function cmdLogin(flags) {
  const url = flags.url;
  if (!url) usageFail("login needs --url <site> plus a key source (--api-key | --api-key-stdin | --api-key-env)");
  const apiKey = await resolveLoginKey(flags);
  const clean = String(url).replace(/\/+$/, "");
  // Validate before saving: an authenticated round-trip.
  await api({ url: clean, apiKey }, "/api/vault");
  saveConfig(clean, apiKey);
  console.log(`logged in to ${clean} (config ${CONFIG_PATH}, mode 600)`);
}

async function cmdList(flags = {}) {
  const cfg = loadConfig();
  const data = await api(cfg, "/api/vault");
  let secrets = data.secrets ?? [];
  if (flags.search !== undefined) {
    if (typeof flags.search === "boolean") usageFail("list --search needs a value");
    const needle = String(flags.search).toLowerCase();
    // Client-side filter over already-listed metadata only (never secret values).
    secrets = secrets.filter(
      (s) =>
        String(s.name ?? "").toLowerCase().includes(needle) ||
        String(s.description ?? "").toLowerCase().includes(needle) ||
        (Array.isArray(s.allowedHosts) ? s.allowedHosts : []).some((h) =>
          String(h).toLowerCase().includes(needle)
        )
    );
  }
  if (secrets.length === 0) {
    console.log(flags.search !== undefined ? "no secrets match." : "no secrets.");
    return;
  }
  for (const s of secrets) {
    const hosts = s.allowedHosts ? s.allowedHosts.join(",") : "-";
    console.log(`${s.name}\t${s.injectAs}\thosts:${hosts}\t${s.preview ?? ""}`);
  }
  console.error(`${secrets.length} secret(s). Previews are masked; use 'get <name> --reveal' to read a value.`);
}

async function cmdGet(positionals, flags) {
  const name = positionals[0];
  if (!name) usageFail("get needs <name>");
  const cfg = loadConfig();
  const hit = await resolveByName(cfg, name);
  if (flags.reveal !== undefined) {
    const full = await api(cfg, `/api/vault/${hit.id}?reveal=1`);
    process.stdout.write(String(full.value ?? ""));
    if (!String(full.value ?? "").endsWith("\n")) process.stdout.write("\n");
    return;
  }
  console.log(
    JSON.stringify(
      {
        id: hit.id,
        name: hit.name,
        description: hit.description ?? null,
        allowedHosts: hit.allowedHosts,
        injectAs: hit.injectAs,
        preview: hit.preview,
        lastUsedAt: hit.lastUsedAt,
        createdAt: hit.createdAt,
        updatedAt: hit.updatedAt,
      },
      null,
      2
    )
  );
}

async function cmdPush(positionals, flags) {
  const name = positionals[0];
  if (!name) usageFail("push needs <name>");
  const value = await resolveValue(flags);
  if (!value) fail("value is empty; refusing to store an empty secret.");
  const cfg = loadConfig();
  const result = await upsert(cfg, name, value, {
    allowedHosts: parseHosts(flags.hosts),
    injectAs: parseInject(flags.inject),
    description: parseDescription(flags.description),
  });
  console.log(`${result} "${name}"`);
}

async function cmdPushEnvFile(positionals, flags) {
  const path = positionals[0];
  if (!path) usageFail("push-env-file needs <path>");
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (e) {
    fail(`cannot read ${path}: ${e.message}`);
  }
  let entries = parseEnvFile(text);
  const allowlist =
    flags.allowlist !== undefined
      ? String(flags.allowlist).split(",").map((k) => k.trim()).filter(Boolean)
      : null;
  const prefix = flags.prefix !== undefined ? String(flags.prefix) : null;
  if (allowlist) {
    const set = new Set(allowlist);
    entries = entries.filter((e) => set.has(e.key));
  } else if (prefix) {
    entries = entries.filter((e) => e.key.startsWith(prefix));
  } else if (flags.all === undefined) {
    usageFail(
      "refusing to push an ambiguous set: pass --all, --allowlist K1,K2, or --prefix <P>.\n" +
        "Review names first, e.g.: grep -E '^[A-Z_]+=' <file> | cut -d= -f1"
    );
  }
  if (entries.length === 0) fail("no matching KEY=VALUE entries found; nothing pushed.");
  const cfg = loadConfig();
  const allowedHosts = parseHosts(flags.hosts);
  const injectAs = parseInject(flags.inject);
  const description = parseDescription(flags.description);
  let created = 0;
  let updated = 0;
  for (const e of entries) {
    const r = await upsert(cfg, e.key, e.value, { allowedHosts, injectAs, description });
    if (r === "created") created++;
    else updated++;
    console.log(`${r} "${e.key}"`);
  }
  // Counts only — values are never printed.
  console.error(`done: ${created} created, ${updated} updated (${entries.length} total).`);
}

async function cmdDelete(positionals) {
  const name = positionals[0];
  if (!name) usageFail("delete needs <name>");
  const cfg = loadConfig();
  const hit = await resolveByName(cfg, name);
  await api(cfg, `/api/vault/${hit.id}`, { method: "DELETE" });
  console.log(`deleted "${name}"`);
}

async function cmdProxy(positionals, flags) {
  const name = positionals[0];
  if (!name) usageFail("proxy needs <name>");
  if (!flags.url) usageFail("proxy needs --url <target> (https, must be in the secret's allowedHosts)");
  const cfg = loadConfig();
  const hit = await resolveByName(cfg, name);
  const payload = { url: String(flags.url) };
  if (flags.method !== undefined) payload.method = String(flags.method);
  if (flags["body-json"] !== undefined) payload.body = String(flags["body-json"]);
  const res = await api(cfg, `/api/proxy/${hit.id}`, { method: "POST", body: payload });
  console.log(JSON.stringify({ status: res.status, headers: res.headers, body: res.body }, null, 2));
}

// ---------------------------------------------------------------------------
// mint: email+password sign-in (session cookie in memory) -> POST /api/keys.
// Bearer keys can never mint keys — the server requires a signed-in
// session — so this is the only CLI path that speaks session cookies.
// Password comes from stdin only (never argv, never stored); the raw key
// is printed ONCE to stdout and, only with --save, written to the config.
// ---------------------------------------------------------------------------

function resolveMintBase(flags) {
  if (flags.url !== undefined) {
    const clean = String(flags.url).replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(clean)) usageFail("mint --url must be an http(s) site origin");
    return clean;
  }
  try {
    const cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    if (cfg.url) return String(cfg.url).replace(/\/+$/, "");
  } catch {
    // fall through to usage error
  }
  usageFail("mint needs --url <site> (or a saved login to reuse its site)");
}

function parseMintDays(raw) {
  if (raw === undefined) return undefined;
  const n = Number(String(raw));
  if (!Number.isInteger(n) || n < 1 || n > 365) usageFail("--days must be an integer 1-365");
  return n * 24 * 3600; // days -> seconds (server clamps into the same window)
}

function parseMintName(raw) {
  if (raw === undefined) return undefined;
  if (typeof raw === "boolean") usageFail("--name needs a value");
  const name = String(raw).trim();
  if (!name) usageFail("--name needs a value");
  return name.slice(0, 64);
}

/** Error text from a better-auth/route payload without ever echoing secrets. */
function errText(data, fallback) {
  const e = data?.error;
  if (typeof e === "string" && e) return e;
  if (e && typeof e.message === "string" && e.message) return e.message;
  if (typeof data?.message === "string" && data.message) return data.message;
  return fallback;
}

function setCookiesOf(res) {
  if (typeof res.headers.getSetCookie === "function") {
    try {
      const arr = res.headers.getSetCookie();
      if (arr && arr.length) return arr;
    } catch {
      // fall through
    }
  }
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

function storeCookies(jar, res) {
  for (const line of setCookiesOf(res)) {
    const pair = String(line).split(";")[0];
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (!name) continue;
    if (!value) jar.delete(name);
    else jar.set(name, value);
  }
}

function cookieHeader(jar) {
  return [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
}

// POST JSON with the in-memory session jar. Trailing-slash URLs are used
// by callers (trailingSlash:true site 308-redirects slashless auth URLs);
// redirect:follow still applies if one appears.
async function mintPost(url, payload, jar) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(jar.size ? { cookie: cookieHeader(jar) } : {}),
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
  } catch (e) {
    fail(`request failed: ${e.message} (is the site URL correct?)`);
  }
  storeCookies(jar, res);
  let data = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON; handled below via !res.ok
  }
  return { res, data };
}

async function readMintPassword(flags) {
  if (flags.password !== undefined) {
    usageFail("password is never a CLI arg; pipe it via stdin (e.g. printf '%s' \"$PW\" | site-vault mint …).");
  }
  if (process.stdin.isTTY) {
    fail("password must come from stdin (e.g. printf '%s' \"$PW\" | site-vault mint --email you@x.com …).");
  }
  const pw = await readStdin();
  if (!pw) fail("empty password on stdin; nothing minted.");
  return pw;
}

async function cmdMint(flags) {
  const email = flags.email;
  if (!email || typeof email === "boolean") {
    usageFail("mint needs --email <addr> (password comes from stdin)");
  }
  const otp = flags.otp !== undefined ? String(flags.otp).trim() : undefined;
  if (flags.otp !== undefined && !otp) usageFail("--otp needs a value");
  const name = parseMintName(flags.name);
  const expiresIn = parseMintDays(flags.days);
  const save = flags.save !== undefined;
  const base = resolveMintBase(flags);

  const password = await readMintPassword(flags); // memory only: never logged, never stored
  const jar = new Map();

  // 1) Email+password sign-in; captures the session cookie in the jar.
  const signIn = await mintPost(`${base}/api/auth/sign-in/email/`, { email: String(email).trim(), password }, jar);
  if (!signIn.res.ok) {
    fail(errText(signIn.data, `sign-in failed (HTTP ${signIn.res.status})`));
  }

  // 2) TOTP second step when the account has 2FA enabled: the server
  // answers success with twoFactorRedirect instead of a session.
  if (signIn.data?.twoFactorRedirect) {
    if (!otp) {
      console.error(
        "site-vault: error: two-factor challenge: sign-in needs the six-digit authenticator code.\n" +
          "Re-run with --otp <code> (password still via stdin)."
      );
      process.exit(2);
    }
    const second = await mintPost(
      `${base}/api/auth/two-factor/verify-totp/`,
      { code: otp, trustDevice: false },
      jar
    );
    if (!second.res.ok) {
      fail(errText(second.data, `two-factor verification failed (HTTP ${second.res.status})`));
    }
  } else if (otp) {
    console.error("site-vault: warning: --otp ignored (account has no two-factor challenge).");
  }

  if (jar.size === 0) fail("sign-in gave no session cookie; cannot mint.");

  // 3) Mint with the session cookie. Same-origin base throughout.
  const body = {};
  if (name !== undefined) body.name = name;
  if (expiresIn !== undefined) body.expiresIn = expiresIn;
  const minted = await mintPost(`${base}/api/keys/`, body, jar);
  if (!minted.res.ok) {
    fail(errText(minted.data, `mint failed (HTTP ${minted.res.status})`));
  }
  const raw =
    (minted.data && typeof minted.data.key === "string" && minted.data.key) ||
    (minted.data?.data && typeof minted.data.data.key === "string" && minted.data.data.key) ||
    null;
  if (!raw) fail("mint succeeded but the server returned no key value.");

  if (save) {
    saveConfig(base, raw);
    console.error(`saved to ${CONFIG_PATH} (mode 600).`);
  }
  // Raw key on stdout ONLY (pipe-friendly); the save-it-now warning goes
  // to stderr so stdout stays clean.
  console.error("API key shown ONCE — save it now; it is never shown again.");
  process.stdout.write(raw.endsWith("\n") ? raw : raw + "\n");
}

async function cmdDedupe(flags) {
  const cfg = loadConfig();
  const prune = flags.prune !== undefined;
  const res = await api(cfg, "/api/vault/dedupe", {
    method: "POST",
    body: { mode: prune ? "prune" : "scan" },
  });
  const exact = res.exact ?? [];
  const near = res.near ?? [];
  if (exact.length === 0) {
    console.log("no exact duplicates.");
  } else {
    for (const g of exact) {
      const note = g.descriptionsDiffer ? " (notes differ, still exact — description is ignored for matching)" : "";
      console.log(`exact: keep "${g.keepName}" (${g.keepId}) drop ${g.dropIds.length}: ${g.dropIds.join(", ")}${note}`);
    }
  }
  if (prune) {
    console.log(`pruned ${res.deletedCount ?? 0} exact duplicate(s) (oldest kept).`);
  }
  if (near.length === 0) {
    console.error("no near-duplicates.");
    return;
  }
  for (const g of near) {
    const desc = (g.descriptions ?? []).filter(Boolean).join(" · ");
    console.error(
      `near: ${(g.names ?? []).join(", ")} matched-on [${(g.matchedOn ?? []).join(", ")}]${desc ? ` notes: ${desc}` : ""} — ${g.suggestion ?? "merge manually via site PATCH/DELETE; never auto-deleted."}`
    );
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === "--help" || cmd === "-h" || cmd === "help") {
    console.log(HELP);
    return;
  }
  const { flags, positionals } = parseArgs(rest);
  switch (cmd) {
    case "login":
      return cmdLogin(flags);
    case "list":
      return cmdList(flags);
    case "get":
      return cmdGet(positionals, flags);
    case "push":
      return cmdPush(positionals, flags);
    case "push-env-file":
      return cmdPushEnvFile(positionals, flags);
    case "delete":
      return cmdDelete(positionals);
    case "proxy":
      return cmdProxy(positionals, flags);
    case "dedupe":
      return cmdDedupe(flags);
    case "mint":
      return cmdMint(flags);
    default:
      usageFail(`unknown command "${cmd}"`);
  }
}

main().catch((e) => fail(e?.message ?? String(e)));
