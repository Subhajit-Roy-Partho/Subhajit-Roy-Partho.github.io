"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

// credentials -> optional TOTP enroll (post-sign-up) / TOTP challenge (sign-in
// second step when the server answers sign-in with twoFactorRedirect).
type Step = "credentials" | "verify" | "enroll" | "enrolled";

function messageOf(res: unknown, fallback: string): string | null {
  if (res && typeof res === "object" && "error" in res) {
    const err = (res as { error?: { message?: unknown } | null }).error;
    if (err && typeof err.message === "string" && err.message) return err.message;
    if (err) return fallback;
  }
  return null;
}

function secretFromURI(uri: string): string | null {
  try {
    return new URL(uri).searchParams.get("secret");
  } catch {
    return null;
  }
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

  // Two-factor state (better-auth built-in TOTP plugin: authenticator apps +
  // backup codes, no SMS/email vendor).
  const [step, setStep] = useState<Step>("credentials");
  const [code, setCode] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [secondBusy, setSecondBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  // L2: which social providers the server actually configured (null = still
  // loading or unreachable, in which case keep the previous behavior and
  // show both buttons rather than risk locking anyone out).
  const [providers, setProviders] = useState<{
    github: boolean;
    google: boolean;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth-config")
      .then(async (r) => {
        if (!r.ok) return;
        const j = (await r.json()) as { github?: unknown; google?: unknown };
        if (!cancelled) {
          setProviders({
            github: j.github === true,
            google: j.google === true,
          });
        }
      })
      .catch(() => {
        /* offline/static mirror — leave defaults */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function done() {
    router.push("/vault");
    router.refresh();
  }

  async function copyText(t: string) {
    try {
      await navigator.clipboard.writeText(t);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Copy failed — select the text manually.");
    }
  }

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
      if (!isSignUp) {
        // Password OK but account has TOTP enabled: server answers success
        // with twoFactorRedirect instead of a session — show the OTP step.
        const data = (res as { data?: { twoFactorRedirect?: boolean } | null })
          .data;
        if (data?.twoFactorRedirect) {
          setCode("");
          setUseBackupCode(false);
          setStep("verify");
          return;
        }
        done();
        return;
      }
      // Fresh account: offer optional authenticator enrollment (skippable).
      setStep("enroll");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  // Sign-in second step: verify the TOTP code (or a backup code).
  async function submitVerify(e: React.FormEvent) {
    e.preventDefault();
    setSecondBusy(true);
    setError(null);
    try {
      const res = useBackupCode
        ? await authClient.twoFactor.verifyBackupCode({ code: code.trim() })
        : await authClient.twoFactor.verifyTotp({
            code: code.trim(),
            trustDevice,
          });
      const msg = messageOf(res, "Verification failed.");
      if (msg) {
        setError(msg);
        return;
      }
      done();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSecondBusy(false);
    }
  }

  // Enrollment: generate the authenticator secret (returns totpURI +
  // backup codes for the totp method).
  async function startEnroll() {
    setSecondBusy(true);
    setError(null);
    try {
      const res = await authClient.twoFactor.enable({ password });
      const msg = messageOf(res, "Could not start 2FA setup.");
      if (msg) {
        setError(msg);
        return;
      }
      const data = res.data;
      if (data && "totpURI" in data && data.totpURI) {
        setTotpURI(data.totpURI);
        setBackupCodes(data.backupCodes ?? []);
        setCode("");
      } else {
        setError("Unexpected response — please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSecondBusy(false);
    }
  }

  // Enrollment: confirm by verifying a code from the authenticator app.
  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    setSecondBusy(true);
    setError(null);
    try {
      const res = await authClient.twoFactor.verifyTotp({
        code: code.trim(),
      });
      const msg = messageOf(res, "Verification failed.");
      if (msg) {
        setError(msg);
        return;
      }
      setCode("");
      setStep("enrolled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSecondBusy(false);
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

  const secret = totpURI ? secretFromURI(totpURI) : null;

  const showGithub = providers?.github ?? true;
  const showGoogle = providers?.google ?? true;
  const showSocial = showGithub || showGoogle;

  return (
    <div className="pt-32">
      <section className="container-page section pt-0">
        <AccountHeader
          eyebrow={
            step === "verify"
              ? "Two-factor check"
              : step === "enroll" || step === "enrolled"
                ? "Secure your account"
                : isSignUp
                  ? "Create account"
                  : "Welcome back"
          }
          title={
            step === "verify"
              ? "Enter your code."
              : step === "enroll" || step === "enrolled"
                ? "Add an authenticator."
                : isSignUp
                  ? "Join the vault."
                  : "Sign in."
          }
          lede={
            step === "verify"
              ? "Your password checked out — finish signing in with your authenticator app."
              : step === "enroll" || step === "enrolled"
                ? "Optional but recommended: a free authenticator app protects your vault even if your password leaks."
                : isSignUp
                  ? "One account unlocks your encrypted secret vault, API keys, and proxied upstreams."
                  : "Pick up where you left off — your secrets stay encrypted until you reveal them."
          }
        />

        {step === "verify" && (
          <Card className="mx-auto mt-10 max-w-md">
            <form onSubmit={submitVerify} className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="auth-code">
                  {useBackupCode ? "Backup code" : "Authenticator code"}
                </label>
                <input
                  id="auth-code"
                  className={fieldClass}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={useBackupCode ? "xxxx-xxxx" : "6-digit code"}
                  inputMode={useBackupCode ? "text" : "numeric"}
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
              {!useBackupCode && (
                <label className={`${noteClass} flex items-center gap-2`}>
                  <input
                    type="checkbox"
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                  />
                  Trust this device for 30 days
                </label>
              )}
              {error && <p className={errorClass}>{error}</p>}
              <button
                type="submit"
                disabled={secondBusy}
                className={`${btnPrimary} w-full`}
              >
                {secondBusy ? "…" : "Verify & sign in"}
              </button>
            </form>
            <button
              type="button"
              className={`${btnGhost} mt-4 w-full`}
              onClick={() => {
                setUseBackupCode((v) => !v);
                setCode("");
                setError(null);
              }}
            >
              {useBackupCode
                ? "Use authenticator code instead"
                : "Use a backup code instead"}
            </button>
          </Card>
        )}

        {step === "enroll" && (
          <Card className="mx-auto mt-10 max-w-md">
            {!totpURI ? (
              <div className="space-y-4">
                <p className={noteClass}>
                  Use any free authenticator app (Google Authenticator, Authy,
                  1Password, …). Setup takes under a minute, and you get backup
                  codes in case you lose your device.
                </p>
                {error && <p className={errorClass}>{error}</p>}
                <button
                  type="button"
                  onClick={startEnroll}
                  disabled={secondBusy}
                  className={`${btnPrimary} w-full`}
                >
                  {secondBusy ? "…" : "Set up authenticator app"}
                </button>
                <button
                  type="button"
                  onClick={done}
                  className={`${btnGhost} w-full`}
                >
                  Skip for now
                </button>
              </div>
            ) : (
              <form onSubmit={confirmEnroll} className="space-y-4">
                <p className={noteClass}>
                  Add this account to your authenticator app by entering the
                  secret below, then confirm with a 6-digit code.
                </p>
                {secret && (
                  <div>
                    <span className={labelClass}>Secret (enter manually)</span>
                    <p className="break-all rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 font-mono text-sm">
                      {secret}
                    </p>
                    <button
                      type="button"
                      onClick={() => secret && copyText(secret)}
                      className={`${btnGhost} mt-2 w-full`}
                    >
                      {copied ? "Copied!" : "Copy secret"}
                    </button>
                  </div>
                )}
                <div>
                  <span className={labelClass}>Setup address</span>
                  <p className="break-all rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 font-mono text-xs text-[var(--muted)]">
                    {totpURI}
                  </p>
                </div>
                <div>
                  <label className={labelClass} htmlFor="enroll-code">
                    Code from your app
                  </label>
                  <input
                    id="enroll-code"
                    className={fieldClass}
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6-digit code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                  />
                </div>
                {error && <p className={errorClass}>{error}</p>}
                <button
                  type="submit"
                  disabled={secondBusy}
                  className={`${btnPrimary} w-full`}
                >
                  {secondBusy ? "…" : "Verify & enable"}
                </button>
              </form>
            )}
          </Card>
        )}

        {step === "enrolled" && (
          <Card className="mx-auto mt-10 max-w-md">
            <div className="space-y-4">
              <p className={noteClass}>
                Two-factor is on. Save these backup codes somewhere safe —
                each works once if you lose your authenticator. They are shown
                only this once.
              </p>
              <ul className="space-y-1.5 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 font-mono text-sm">
                {backupCodes.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => copyText(backupCodes.join("\n"))}
                className={`${btnGhost} w-full`}
              >
                {copied ? "Copied!" : "Copy all codes"}
              </button>
              <button
                type="button"
                onClick={done}
                className={`${btnPrimary} w-full`}
              >
                Done — open my vault
              </button>
            </div>
          </Card>
        )}

        {step === "credentials" && (
          <Card className="mx-auto mt-10 max-w-md">
            {showSocial ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {showGithub && (
                    <button
                      type="button"
                      onClick={() => social("github")}
                      disabled={socialBusy !== null}
                      className={btnGhost}
                    >
                      {socialBusy === "github" ? "…" : "GitHub"}
                    </button>
                  )}
                  {showGoogle && (
                    <button
                      type="button"
                      onClick={() => social("google")}
                      disabled={socialBusy !== null}
                      className={btnGhost}
                    >
                      {socialBusy === "google" ? "…" : "Google"}
                    </button>
                  )}
                </div>

                <div className="my-6 flex items-center gap-3 text-xs text-[var(--muted)]">
                  <span className="h-px flex-1 bg-[var(--border)]" />
                  or with email
                  <span className="h-px flex-1 bg-[var(--border)]" />
                </div>
              </>
            ) : (
              <p className={`${noteClass} mb-6`}>
                Social sign-in isn&apos;t configured on this deployment — use
                email below.
              </p>
            )}

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
        )}
      </section>
    </div>
  );
}
