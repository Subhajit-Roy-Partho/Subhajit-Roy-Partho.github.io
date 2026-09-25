import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin } from "better-auth/plugins/admin";
import { twoFactor } from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";

import { db } from "@/db";

function required(name: string, fallbackBuildOnly?: string): string {
  const v = process.env[name];
  if (v) return v;
  // Route collection during `next build` must not crash on missing secrets;
  // runtime on Vercel always has them. (Pages never imports this module.)
  if (process.env.NEXT_PHASE === "phase-production-build" && fallbackBuildOnly) {
    return fallbackBuildOnly;
  }
  throw new Error(`Missing ${name}. See .env.example (Vercel-only vars).`);
}

// Stable production origin. Orchestrator sets BETTER_AUTH_URL to this alias
// on Vercel; it is also the default the static mirror links back to.
const LIVE_ORIGIN = "https://subhajit-roy.vercel.app";
// Previous alias, kept trusted so old links/callbacks don't break.
const LEGACY_ORIGIN =
  "https://subhajit-roy-partho-github-io-subhajit-roys-projects.vercel.app";

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

// Same-origin by default (undefined lets better-auth derive the origin from
// the request). Never silently fall back to localhost in production — a
// localhost baseURL would make every sign-in redirect/callback point at the
// developer's machine on the live site. Fail loud instead.
function resolveBaseURL(): string | undefined {
  const url =
    process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (
    url &&
    process.env.NODE_ENV === "production" &&
    !isBuildPhase() &&
    /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?([/?#]|$)/i.test(url)
  ) {
    throw new Error(
      `Refusing localhost baseURL in production: ${url}. Set BETTER_AUTH_URL to ${LIVE_ORIGIN}.`
    );
  }
  return url;
}

function resolveTrustedOrigins(): string[] {
  const origins = new Set<string>([LIVE_ORIGIN, LEGACY_ORIGIN]);
  if (process.env.VERCEL_URL) origins.add(`https://${process.env.VERCEL_URL}`);
  const envUrl = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl && !/localhost|127\.0\.0\.1/i.test(envUrl)) origins.add(envUrl);
  return [...origins];
}

export const auth = betterAuth({
  secret: required(
    "BETTER_AUTH_SECRET",
    "build-time-placeholder-secret-min-32-chars!!"
  ),
  baseURL: resolveBaseURL(),
  // The stable Vercel alias is always trusted (BETTER_AUTH_URL is set to it
  // on Vercel). VERCEL_URL covers preview deployments; an explicitly set
  // BETTER_AUTH_URL is trusted too when it differs from the alias.
  trustedOrigins: resolveTrustedOrigins(),
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    // M4 note: email verification stays OFF because no mailer is
    // configured — requiring it would lock out every new account (no
    // verification email could ever arrive). Revisit
    // requireEmailVerification + sendVerificationEmail once an email
    // provider exists. Abuse containment meanwhile = per-IP rate limits
    // (lib/server/rate-limit.ts) on /api/auth, vault, proxy, and keys.
    requireEmailVerification: false,
  },
  // L2: only configure providers whose credentials are actually set.
  // Empty-string clientId/secret would register broken buttons; the
  // sign-in UI hides providers missing from /api/auth-config.
  socialProviders: {
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  plugins: [
    admin(),
    // H3: keys are powerful (full vault+proxy access, no 2FA challenge at
    // use time), so they expire by default and are usage-capped. Minting
    // and deletion additionally require a signed-in browser session (see
    // app/api/keys/*) — Bearer keys can never mint or revoke keys. The
    // plugin has no "require 2FA to mint" switch, so that gate lives in
    // the route layer; the 2FA-exempt-at-use status is documented on
    // /extras/apibank.
    apiKey({
      requireName: true,
      keyExpiration: {
        // 90 days, in seconds. Clients may request 1–365 days.
        defaultExpiresIn: 90 * 24 * 3600,
        disableCustomExpiresTime: false,
        minExpiresIn: 1,
        maxExpiresIn: 365,
      },
      rateLimit: {
        enabled: true,
        timeWindow: 86_400_000, // 1 day, in ms
        maxRequests: 1000,
      },
    }),
    // Free TOTP 2FA: authenticator apps + backup codes. No OTP vendor
    // configured, so email/SMS codes stay disabled; `enable` defaults to
    // the totp method (returns totpURI + backupCodes).
    twoFactor({ issuer: "Subhajit Roy" }),
  ],
});

export type Auth = typeof auth;
