"use client";

import { useRef } from "react";
import { motion, useSpring } from "framer-motion";
import Link from "next/link";
import type { ReactNode, MouseEvent } from "react";

const MotionLink = motion(Link);

export function MagneticButton({
  href,
  children,
  variant = "solid",
  external,
}: {
  href: string;
  children: ReactNode;
  variant?: "solid" | "outline";
  external?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useSpring(0, { stiffness: 250, damping: 18 });
  const y = useSpring(0, { stiffness: 250, damping: 18 });

  function onMouseMove(e: MouseEvent<HTMLAnchorElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) * 0.35);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.35);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const classes =
    variant === "solid"
      ? "bg-[var(--foreground)] text-[var(--background)] hover:opacity-90"
      : "border border-[var(--border)] text-[var(--foreground)] hover:border-[var(--accent)] hover:text-[var(--accent)]";

  const className = `inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors ${classes}`;

  // Non-route targets (external sites, mailto:, static files like the CV PDF) must be
  // plain anchors — Next's <Link> treats any href as an app route and tries to prefetch
  // it via the client router, which 404s for anything that isn't an actual page.
  if (external) {
    const MotionA = motion.a;
    return (
      <MotionA
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ x, y }}
        className={className}
      >
        {children}
      </MotionA>
    );
  }

  return (
    <MotionLink
      ref={ref}
      href={href}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ x, y }}
      className={className}
    >
      {children}
    </MotionLink>
  );
}
