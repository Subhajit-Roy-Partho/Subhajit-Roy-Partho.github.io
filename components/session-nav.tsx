"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { ENABLE_DB, SITE_URL } from "@/lib/env";
import { cn } from "@/lib/utils";

const linkCls = (active: boolean) =>
  cn(
    "rounded-full px-3.5 py-1.5 text-sm transition-colors",
    active
      ? "text-[var(--accent)]"
      : "text-[var(--muted)] hover:text-[var(--foreground)]"
  );

// Session-aware corner of the nav. Matches the existing pill-link style.
export function SessionNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  // Static mirror: no backend, so point at the live site instead.
  if (!ENABLE_DB) {
    return (
      <a
        href={`${SITE_URL}/sign-in`}
        target="_blank"
        rel="noopener noreferrer"
        className={linkCls(false)}
      >
        Sign in <span aria-hidden>↗</span>
      </a>
    );
  }

  const { data: session, isPending } = useSession();
  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string | null }
    | undefined;
  const isAdmin = user?.role === "admin";

  async function signOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      onNavigate?.();
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  if (isPending) {
    return (
      <span className="rounded-full px-3.5 py-1.5 text-sm text-[var(--muted)]">
        …
      </span>
    );
  }

  if (!user) {
    return (
      <Link
        href="/sign-in"
        onClick={() => onNavigate?.()}
        className={linkCls(pathname === "/sign-in" || pathname === "/sign-up")}
      >
        Sign in
      </Link>
    );
  }

  const initial = (user.name ?? user.email ?? "?").trim().charAt(0).toUpperCase();

  return (
    <span className="flex items-center gap-1">
      <Link
        href="/vault"
        onClick={() => onNavigate?.()}
        className={linkCls(pathname?.startsWith("/vault") ?? false)}
      >
        Vault
      </Link>
      <Link
        href="/keys"
        onClick={() => onNavigate?.()}
        className={linkCls(pathname?.startsWith("/keys") ?? false)}
      >
        Keys
      </Link>
      {isAdmin && (
        <Link
          href="/admin"
          onClick={() => onNavigate?.()}
          className={linkCls(pathname?.startsWith("/admin") ?? false)}
        >
          Admin
        </Link>
      )}
      <span
        title={user.email ?? user.name ?? "Signed in"}
        className="ml-1 grid h-7 w-7 place-items-center rounded-full border border-[var(--border)] bg-[var(--accent-soft)] font-display text-xs font-semibold text-[var(--accent)]"
      >
        {initial}
      </span>
      <button
        onClick={signOut}
        disabled={signingOut}
        className={cn(linkCls(false), "disabled:opacity-50")}
      >
        {signingOut ? "…" : "Sign out"}
      </button>
    </span>
  );
}
