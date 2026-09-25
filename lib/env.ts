// Central feature flags / public env. Never put secrets behind NEXT_PUBLIC_.
// Server secrets live in process.env directly (see db/index.ts, lib/auth.ts,
// lib/server/vault-crypto.ts) and must never be re-exported here.

export const ENABLE_DB = process.env.NEXT_PUBLIC_ENABLE_DB === "1";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
