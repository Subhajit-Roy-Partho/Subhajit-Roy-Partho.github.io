"use client";

import dynamic from "next/dynamic";

const DnaScene = dynamic(() => import("./dna-scene"), { ssr: false });

export function HeroCanvas() {
  return <DnaScene />;
}
