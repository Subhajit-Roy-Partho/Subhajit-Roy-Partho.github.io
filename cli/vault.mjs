#!/usr/bin/env node
// site-vault — PC CLI for the per-user vault API.
//
//   login | list | get | push | push-env-file | delete | proxy
//
// Auth: Bearer API key (created on the site's /keys page). Session cookies
// are a browser concern; this CLI only speaks Bearer.
// Secrets are NEVER logged: list/get print the server's masked preview only.
// The sole exception is `get <name> --reveal`, which prints the raw value to
// stdout (pipe-friendly) and nothing else.
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

/** Upsert one secret by name: POST, falling back to PATCH on 409. Never logs the value. */
async function upsert(cfg, name, value, { allowedHosts, injectAs } = {}) {
  const payload = { name, value };
  if (allowedHosts !== undefined) payload.allowedHosts = allowedHosts;
  if (injectAs !== undefined) payload.injectAs = injectAs;

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
  site-vault list
  site-vault get <name> [--reveal]
  site-vault push <name> (--value <v> | --value-stdin | --env-key <KEY>)
                        [--hosts h1,h2] [--inject header|body]
  site-vault push-env-file <path> [--prefix <P>] [--allowlist K1,K2 | --all]
  site-vault delete <name>
  site-vault proxy <name> --url <target> [--method <M>] [--body-json '<json>']

Notes:
  - Prefer 'login --api-key-stdin' or '--api-key-env <VAR>': a key passed as
    --api-key can linger in shell history. Same for secret values: prefer
    --value-stdin / --env-key over --value.
  - Values are never printed except by 'get --reveal' (raw value on stdout).
    Everywhere else only the server's masked preview is shown.
  - push upserts: creates, or updates the value (409 -> PATCH) if <name> exists.
  - push-env-file never prints values; it reports names + created/updated counts.
  - proxy injects the secret server-side; the secret never touches this machine.
    Trusted-hosts warning: the server will send the secret to ANY of the
    secret's allowed hosts — only allowlist hosts you trust with the value.
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

async function cmdList() {
  const cfg = loadConfig();
  const data = await api(cfg, "/api/vault");
  const secrets = data.secrets ?? [];
  if (secrets.length === 0) {
    console.log("no secrets.");
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
  let created = 0;
  let updated = 0;
  for (const e of entries) {
    const r = await upsert(cfg, e.key, e.value, { allowedHosts, injectAs });
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
      return cmdList();
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
    default:
      usageFail(`unknown command "${cmd}"`);
  }
}

main().catch((e) => fail(e?.message ?? String(e)));
