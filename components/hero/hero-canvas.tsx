"use client";

import dynamic from "next/dynamic";

const DnaScene = dynamic(() => import("./dna-scene"), {
  ssr: false,
  // Fixed overlay matching the canvas container (absolute inset-0 inside the
  // min-h-[100svh] hero), so the placeholder reserves exactly the space the
  // WebGL canvas will take — no layout shift, CLS stays at 0.
  loading: () => (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(45% 35% at 50% 45%, var(--accent-soft), transparent 70%), radial-gradient(60% 50% at 50% 30%, transparent, var(--background) 85%)",
      }}
    >
      <div className="absolute inset-0 animate-pulse bg-[var(--accent-soft)]/40" />
    </div>
  ),
});

export function HeroCanvas() {
  return <DnaScene />;
}
