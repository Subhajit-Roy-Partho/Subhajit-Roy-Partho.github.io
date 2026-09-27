"use client";

import dynamic from "next/dynamic";

// The simulator (~1400-line canvas solver UI) is heavy client JS that sits
// below the fold. Split it out with ssr:false so none of it blocks first
// paint; the skeleton below reserves the paper's exact aspect ratio
// (30:18 default sheet) plus the control column, keeping CLS at 0.
const ElectrostaticSimulator = dynamic(
  () => import("./electrostatic-simulator").then((m) => m.ElectrostaticSimulator),
  {
    ssr: false,
    loading: () => (
      <div className="mt-12" aria-hidden>
        <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="card-surface min-w-0 p-4 sm:p-5">
            <div className="mb-3 h-3 w-64 animate-pulse rounded bg-[var(--border)]/60" />
            <div
              className="w-full animate-pulse rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]/40"
              style={{ aspectRatio: "30 / 18" }}
            />
            <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-[var(--border)]/60" />
          </div>
          <div className="card-surface space-y-4 p-5">
            <div className="h-3 w-24 animate-pulse rounded bg-[var(--border)]/60" />
            <div className="h-8 w-full animate-pulse rounded-lg bg-[var(--border)]/60" />
            <div className="h-8 w-full animate-pulse rounded-lg bg-[var(--border)]/60" />
            <div className="h-8 w-2/3 animate-pulse rounded-lg bg-[var(--border)]/60" />
          </div>
        </div>
      </div>
    ),
  }
);

export function SimulatorLoader() {
  return <ElectrostaticSimulator />;
}
