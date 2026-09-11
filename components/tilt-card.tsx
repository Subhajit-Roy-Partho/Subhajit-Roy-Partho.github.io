"use client";

import { useRef } from "react";
import { motion, useMotionTemplate, useSpring } from "framer-motion";
import type { ReactNode } from "react";

export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, { stiffness: 200, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 200, damping: 20 });
  const glowX = useSpring(50, { stiffness: 200, damping: 25 });
  const glowY = useSpring(50, { stiffness: 200, damping: 25 });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rotateY.set((px - 0.5) * 10);
    rotateX.set((0.5 - py) * 10);
    glowX.set(px * 100);
    glowY.set(py * 100);
  }

  function onMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
    glowX.set(50);
    glowY.set(50);
  }

  const background = useMotionTemplate`radial-gradient(320px circle at ${glowX}% ${glowY}%, var(--accent-soft), transparent 70%)`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={`card-surface group relative overflow-hidden p-6 transition-shadow duration-300 hover:shadow-[0_20px_60px_-30px_var(--accent)] ${className ?? ""}`}
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background }} />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
