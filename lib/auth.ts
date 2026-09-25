import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin } from "better-auth/plugins/admin";
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
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    },
  },
  plugins: [admin(), apiKey()],
});

export type Auth = typeof auth;
