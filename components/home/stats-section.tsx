"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Reveal } from "../reveal";
import { StatValue } from "../stats-counter";
import { stats } from "@/data/site";

export function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);
  const boxShadow = useTransform(
    scrollYProgress,
    [0, 1],
    ["0 30px 80px -40px rgba(34, 211, 238, 0)", "0 30px 80px -40px rgba(34, 211, 238, 0.35)"]
  );

  return (
    <section className="section container-page">
      <motion.div
        ref={ref}
        style={{ scale, boxShadow }}
        className="card-surface grid grid-cols-2 gap-8 p-8 sm:grid-cols-4 sm:p-10"
      >
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.06} className="text-center sm:text-left">
            <p className="font-display text-3xl font-semibold sm:text-4xl">
              <StatValue value={stat.value} />
            </p>
            <p className="mt-2 text-xs uppercase tracking-wide text-[var(--muted)] sm:text-sm">{stat.label}</p>
          </Reveal>
        ))}
      </motion.div>
    </section>
  );
}
