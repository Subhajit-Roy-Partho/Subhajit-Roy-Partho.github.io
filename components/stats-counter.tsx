"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

function AnimatedNumber({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const start = performance.now();
    let frame: number;

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target]);

  return <span ref={ref}>{value}</span>;
}

export function StatValue({ value }: { value: string }) {
  const match = value.match(/^(\d+)(.*)$/);
  if (!match) return <>{value}</>;
  const [, digits, suffix] = match;
  return (
    <>
      <AnimatedNumber target={Number(digits)} />
      {suffix}
    </>
  );
}
