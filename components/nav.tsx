"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/about", label: "About" },
  { href: "/research", label: "Research" },
  { href: "/publications", label: "Publications" },
  { href: "/cv", label: "CV" },
  { href: "/blog", label: "Blog" },
  { href: "/extras", label: "Extras" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation. Adjusting state during render (rather than in an
  // effect) avoids an extra render pass — see https://react.dev/learn/you-might-not-need-an-effect
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled ? "backdrop-blur-md bg-[var(--background)]/70 border-b border-[var(--border)]" : "bg-transparent"
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-sm font-semibold tracking-tight">
          Subhajit&nbsp;Roy
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm transition-colors",
                  active
                    ? "text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {open ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-[var(--border)] bg-[var(--background)] md:hidden">
          <div className="container-page flex flex-col py-3">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-2 py-2.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
