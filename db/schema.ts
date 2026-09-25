// Drizzle schema (sqlite/Turso).
// Core auth tables follow the better-auth sqlite shape; the apiKey plugin
// manages the `apikey` table (do not hand-roll key hashing — the plugin owns it).
// Custom tables: vault_secrets, audit_logs.
//
// TODO (orchestrator): if `npx @better-auth/cli generate` becomes available
// against a live Turso DB, diff its output against this file and reconcile.

import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

// --- better-auth core tables ---

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
  // better-auth admin plugin fields
  role: text("role").default("user"),
  banned: integer("banned", { mode: "boolean" }).default(false),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp" }),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow(),
});

// --- better-auth apiKey plugin table (plugin-owned hashing; nullable extras
// keep us forward-compatible with plugin defaults) ---

export const apikey = sqliteTable("apikey", {
  id: text("id").primaryKey(),
  name: text("name"),
  start: text("start"),
  prefix: text("prefix"),
  key: text("key").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  refillInterval: integer("refill_interval"),
  refillAmount: integer("refill_amount"),
  lastRefillAt: integer("last_refill_at", { mode: "timestamp" }),
  enabled: integer("enabled", { mode: "boolean" }).default(true),
  rateLimitEnabled: integer("rate_limit_enabled", { mode: "boolean" }).default(
    false
  ),
  rateLimitTimeWindow: integer("rate_limit_time_window"),
  rateLimitMax: integer("rate_limit_max"),
  requestCount: integer("request_count").default(0),
  remaining: integer("remaining"),
  lastRequest: integer("last_request", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).defaultNow().notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).defaultNow().notNull(),
  permissions: text("permissions"),
  metadata: text("metadata"),
});

// --- app tables ---

export const vaultSecrets = sqliteTable(
  "vault_secrets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // JSON array of exact-match allowed hosts (max 10), null = proxy disabled.
    allowedHostsJson: text("allowed_hosts_json"),
    // e.g. "header" | "body" — hint for the designer-owned UI.
    injectAs: text("inject_as").default("header").notNull(),
    // AES-256-GCM ciphertext envelope "iv:tag:ct" (base64 parts).
    ciphertext: text("ciphertext").notNull(),
    iv: text("iv").notNull(),
    keyVersion: integer("key_version").default(1).notNull(),
    lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
      .defaultNow()
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .defaultNow()
      .notNull(),
  },
  (t) => [unique("vault_secrets_user_name_unique").on(t.userId, t.name)]
);

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  actorUserId: text("actor_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  targetHost: text("target_host"),
  status: text("status").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .defaultNow()
    .notNull(),
});
