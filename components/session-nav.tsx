"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

const menuItemCls = (active: boolean) =>
  cn(
    "block w-full rounded-full px-3.5 py-1.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
    active
      ? "text-[var(--accent)]"
      : "text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
  );

type SessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};

function AvatarCircle({ user }: { user?: SessionUser }) {
  const initial = (user?.name ?? user?.email ?? "?").trim().charAt(0).toUpperCase();
  if (user?.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image}
        alt=""
        aria-hidden
        className="h-8 w-8 rounded-full border border-[var(--border)] object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid h-8 w-8 place-items-center rounded-full border border-[var(--border)] bg-[var(--accent-soft)] font-display text-xs font-semibold text-[var(--accent)]"
    >
      {initial}
    </span>
  );
}

// Session-aware corner of the nav. Matches the existing pill-link style.
// Signed-in account controls (Vault / API keys / Admin / Sign out) live in a
// dropdown opened by the avatar button.
export function SessionNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data: session, isPending } = useSession();

  const user = session?.user as SessionUser | undefined;
  const isAdmin = user?.role === "admin";

  // Close on outside click + Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open ]);

  function close() {
    setOpen(false);
    onNavigate?.();
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      setOpen(false);
      onNavigate?.();
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  // Static mirror: no backend, so point at the live site instead of dead
  // local auth/account routes.
  if (!ENABLE_DB) {
    return (
      <span className="flex items-center gap-1">
        <a
          href={`${SITE_URL}/sign-in`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Sign in on the live site"
          title="Sign in on the live site"
          className="grid h-8 w-8 place-items-center rounded-full border border-[var(--border)] bg-[var(--accent-soft)] font-display text-xs font-semibold text-[var(--accent)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <span aria-hidden>→</span>
        </a>
        <a
          href={`${SITE_URL}/sign-in`}
          target="_blank"
          rel="noopener noreferrer"
          className={linkCls(false)}
        >
          Sign in <span aria-hidden>↗</span>
        </a>
      </span>
    );
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

  const label = user.name ?? user.email ?? "Account";

  return (
    <div ref={wrapRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${label} — account menu`}
        title={user.email ?? user.name ?? "Signed in"}
        className="grid place-items-center rounded-full transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <AvatarCircle user={user} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="card-surface absolute right-0 top-full z-50 mt-2 flex min-w-44 flex-col gap-0.5 p-1.5 shadow-[0_20px_60px_-30px_var(--accent)]"
        >
          <Link
            role="menuitem"
            href="/vault"
            onClick={close}
            className={menuItemCls(pathname?.startsWith("/vault") ?? false)}
          >
            Vault
          </Link>
          <Link
            role="menuitem"
            href="/keys"
            onClick={close}
            className={menuItemCls(pathname?.startsWith("/keys") ?? false)}
          >
            API keys
          </Link>
          {isAdmin && (
            <Link
              role="menuitem"
              href="/admin"
              onClick={close}
              className={menuItemCls(pathname?.startsWith("/admin") ?? false)}
            >
              Admin
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className={cn(menuItemCls(false), "disabled:opacity-50")}
          >
            {signingOut ? "…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
