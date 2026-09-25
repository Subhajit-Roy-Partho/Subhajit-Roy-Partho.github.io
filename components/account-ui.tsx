import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const fieldClass =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--accent)]";

export const labelClass =
  "mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[#04121a] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50";

export const btnDanger =
  "inline-flex items-center justify-center gap-2 rounded-full border border-red-500/40 px-4 py-2 text-sm text-red-400 transition hover:border-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50";

export const errorClass =
  "rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300";

export const noteClass = "text-sm leading-relaxed text-[var(--muted)]";

export function AccountHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
        {eyebrow}
      </p>
      <h1 className="font-display mt-4 max-w-2xl text-[clamp(2rem,5vw,3rem)] font-semibold leading-tight tracking-tight">
        {title}
      </h1>
      <p className="mt-4 max-w-xl text-[var(--muted)]">{lede}</p>
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card-surface p-6 sm:p-8", className)}>{children}</div>
  );
}
