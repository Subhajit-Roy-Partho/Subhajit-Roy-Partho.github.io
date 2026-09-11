"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MoleculeScene = dynamic(() => import("./molecule-scene"), { ssr: false });

// Rendered only above the `sm` breakpoint — skip mounting the WebGL canvas at all on
// phones rather than just hiding it with CSS, so mobile doesn't pay for a GPU context
// it will never see.
export function MoleculeCanvas({ className }: { className?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    // `window` doesn't exist during SSR, so this has to run post-mount rather than as a
    // lazy useState initializer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setVisible(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (!visible) return null;

  return (
    <div className={className} aria-hidden>
      <MoleculeScene />
    </div>
  );
}
