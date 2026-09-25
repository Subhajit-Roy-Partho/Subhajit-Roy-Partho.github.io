"use client";

// Designer hook: typed client for vault/admin UI (designer owns the pages).
// Plugins mirror the server: admin + apiKey clients.

import { createAuthClient } from "better-auth/client";
import { adminClient } from "better-auth/client/plugins";
import { apiKeyClient } from "@better-auth/api-key/client";
import { useSyncExternalStore } from "react";

export const authClient = createAuthClient({
  plugins: [adminClient(), apiKeyClient()],
});

export type AuthClient = typeof authClient;

// In this better-auth version `authClient.useSession` is a nanostores atom,
// not a React hook. This wrapper subscribes to it the React-safe way:
//   const { data: session, isPending } = useSession();
export function useSession() {
  return useSyncExternalStore(
    (onChange) => authClient.useSession.subscribe(onChange),
    () => authClient.useSession.get(),
    () => authClient.useSession.get()
  );
}

// Convenience re-exports for UI code:
//   const { data: session } = authClient.useSession();
//   await authClient.signIn.email({ email, password });
//   await authClient.signIn.social({ provider: "github" | "google" });
//   authClient.apiKey.create({ name }) / .list() / .delete({ keyId })
