import "server-only";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

function createDb() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  // During `next build` route collection there is no DB; use a throwaway
  // local file so module init succeeds. At runtime (Vercel), missing vars
  // fail loud — but this module is never imported when !ENABLE_DB, so
  // GitHub Pages static export is unaffected.
  if (!url || !authToken) {
    if (process.env.NEXT_PHASE === "phase-production-build") {
      const client = createClient({ url: "file:./.next-build.db" });
      return drizzle(client, { schema });
    }
    throw new Error(
      "Missing TURSO_DATABASE_URL / TURSO_AUTH_TOKEN. " +
        "Set Vercel-only env vars (see .env.example). " +
        "This module must never be imported when NEXT_PUBLIC_ENABLE_DB !== '1'."
    );
  }

  const client = createClient({ url, authToken });
  return drizzle(client, { schema });
}

export const db = createDb();
export type Db = typeof db;
