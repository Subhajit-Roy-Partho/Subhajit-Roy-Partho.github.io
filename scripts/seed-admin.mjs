#!/usr/bin/env node
// seed-admin.mjs — create the first admin user via the better-auth API.
//
// Reads ONLY from the environment (never argv, never hardcoded):
//   VAULT_ADMIN_EMAIL, VAULT_ADMIN_NAME, VAULT_ADMIN_PASSWORD  (required)
//   BETTER_AUTH_SECRET, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN   (required,
//     same server vars the app itself needs — see .env.example)
//
// If the user already exists, it is promoted to admin instead of failing.
// Nothing secret is ever printed.
//
// Run:  node scripts/seed-admin.mjs
// Needs Node >= 22 (type-stripping for the relative .ts imports below).
// This script deliberately builds its own betterAuth instance from relative
// imports so it never touches lib/auth.ts, lib/server/, or app/api/.

import { eq } from "drizzle-orm";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin } from "better-auth/plugins/admin";
import { apiKey } from "@better-auth/api-key";

import * as schema from "../db/schema.ts";

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(
      `seed-admin: refusing to run — missing ${name} in the environment. ` +
        `Export it first; never pass secrets as argv or commit them.`
    );
    process.exit(1);
  }
  return v;
}

const email = required("VAULT_ADMIN_EMAIL");
const name = required("VAULT_ADMIN_NAME");
const password = required("VAULT_ADMIN_PASSWORD");
const secret = required("BETTER_AUTH_SECRET");
const dbUrl = required("TURSO_DATABASE_URL");
const dbToken = required("TURSO_AUTH_TOKEN");

const client = createClient({ url: dbUrl, authToken: dbToken });
const db = drizzle(client, { schema });

const auth = betterAuth({
  secret,
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: { enabled: true },
  plugins: [admin(), apiKey()],
});

let userId = null;
try {
  const res = await auth.api.signUpEmail({ body: { name, email, password } });
  userId = res?.user?.id ?? null;
  console.log(`seed-admin: created user "${email}".`);
} catch (e) {
  const msg = e?.message ?? String(e);
  if (/already|exists|taken|duplicate|unique/i.test(msg)) {
    const rows = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, email));
    if (rows.length === 0) {
      console.error("seed-admin: sign-up reported a conflict but no such user exists.");
      process.exit(1);
    }
    userId = rows[0].id;
    console.log(`seed-admin: user "${email}" already exists; promoting to admin.`);
  } else {
    console.error(`seed-admin: sign-up failed: ${msg}`);
    process.exit(1);
  }
}

await db.update(schema.user).set({ role: "admin" }).where(eq(schema.user.id, userId));
console.log(`seed-admin: "${email}" now has role admin.`);
