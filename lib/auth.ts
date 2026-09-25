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

export const auth = betterAuth({
  secret: required(
    "BETTER_AUTH_SECRET",
    "build-time-placeholder-secret-min-32-chars!!"
  ),
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL,
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
