// Central feature flags / public env. Never put secrets behind NEXT_PUBLIC_.
// Server secrets live in process.env directly (see db/index.ts, lib/auth.ts,
// lib/server/vault-crypto.ts) and must never be re-exported here.

export const ENABLE_DB = process.env.NEXT_PUBLIC_ENABLE_DB === "1";

// Stable production origin (Vercel alias). The GitHub Pages static mirror has
// no backend, so every link that needs the live app points here. Never fall
// back to localhost in production — that would ship dead/local links on both
// Vercel preview builds and the Pages export. Local dev sets
// NEXT_PUBLIC_SITE_URL=http://localhost:3000 in .env.local instead.
export const LIVE_SITE_URL =
  "https://subhajit-roy.vercel.app";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production"
    ? LIVE_SITE_URL
    : "http://localhost:3000");
