"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { HeroCanvas } from "./hero-canvas";
import { MagneticButton } from "../magnetic-button";
import { profile } from "@/data/site";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });

  const contentY = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  return (
    <section ref={sectionRef} className="relative flex min-h-[100svh] items-center overflow-hidden">
      <HeroCanvas />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 30%, transparent, var(--background) 85%), linear-gradient(180deg, transparent 60%, var(--background))",
        }}
      />

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="container-page relative z-10 pt-24">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="chip mb-6 w-fit"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          {profile.role}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display max-w-3xl text-[clamp(2.5rem,7vw,5.25rem)] font-semibold leading-[1.02] tracking-tight"
        >
          Designing genetic
          <br />
          matter that <span className="text-gradient">assembles itself</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-6 max-w-xl text-lg text-[var(--muted)]"
        >
          I&apos;m {profile.name}, a computational biophysicist at {profile.affiliation} building simulation
          engines, ML models, and design tools for DNA &amp; RNA nanotechnology.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 flex flex-wrap gap-4"
        >
          <MagneticButton href="/research">Explore the research</MagneticButton>
          <MagneticButton href="/publications" variant="outline">
            Read the publications
          </MagneticButton>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ opacity: cueOpacity }}
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-xs uppercase tracking-[0.3em] text-[var(--muted)]"
      >
        <div className="flex flex-col items-center gap-2">
          <span>Scroll</span>
          <span className="h-8 w-px animate-pulse bg-[var(--muted)]" />
        </div>
      </motion.div>
    </section>
  );
}
