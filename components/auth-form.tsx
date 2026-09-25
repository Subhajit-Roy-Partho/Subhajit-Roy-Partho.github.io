"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  AccountHeader,
  btnGhost,
  btnPrimary,
  Card,
  errorClass,
  fieldClass,
  labelClass,
  noteClass,
} from "@/components/account-ui";

type Mode = "sign-in" | "sign-up";

function messageOf(res: unknown, fallback: string): string | null {
  if (res && typeof res === "object" && "error" in res) {
    const err = (res as { error?: { message?: unknown } | null }).error;
    if (err && typeof err.message === "string" && err.message) return err.message;
    if (err) return fallback;
  }
  return null;
}

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const isSignUp = mode === "sign-up";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [socialBusy, setSocialBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = isSignUp
        ? await authClient.signUp.email({
            email: email.trim(),
            password,
            name: name.trim() || email.trim(),
          })
        : await authClient.signIn.email({
            email: email.trim(),
            password,
          });
      const msg = messageOf(res, isSignUp ? "Sign-up failed." : "Sign-in failed.");
      if (msg) {
        setError(msg);
        return;
      }
      router.push("/vault");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function social(provider: "github" | "google") {
    setSocialBusy(provider);
    setError(null);
    try {
      const res = await authClient.signIn.social({
        provider,
        callbackURL: "/vault",
      });
      const msg = messageOf(res, `${provider} sign-in failed.`);
      if (msg) setError(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSocialBusy(null);
    }
  }

  return (
    <div className="pt-32">
      <section className="container-page section pt-0">
        <AccountHeader
          eyebrow={isSignUp ? "Create account" : "Welcome back"}
          title={isSignUp ? "Join the vault." : "Sign in."}
          lede={
            isSignUp
              ? "One account unlocks your encrypted secret vault, API keys, and proxied upstreams."
              : "Pick up where you left off — your secrets stay encrypted until you reveal them."
          }
        />
        <Card className="mx-auto mt-10 max-w-md">
          <div className="grid grid-cols-2 gap-3">
            {(["github", "google"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => social(p)}
                disabled={socialBusy !== null}
                className={btnGhost}
              >
                {socialBusy === p ? "…" : p === "github" ? "GitHub" : "Google"}
              </button>
            ))}
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-[var(--muted)]">
            <span className="h-px flex-1 bg-[var(--border)]" />
            or with email
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className={labelClass} htmlFor="auth-name">
                  Name
                </label>
                <input
                  id="auth-name"
                  className={fieldClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label className={labelClass} htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                className={fieldClass}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                className={fieldClass}
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>
            {error && <p className={errorClass}>{error}</p>}
            <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
              {busy ? "…" : isSignUp ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className={`${noteClass} mt-6 text-center`}>
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <Link href="/sign-in" className="text-[var(--accent)] hover:underline">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{" "}
                <Link href="/sign-up" className="text-[var(--accent)] hover:underline">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </Card>
      </section>
    </div>
  );
}
