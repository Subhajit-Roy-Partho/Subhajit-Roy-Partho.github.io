import dynamic from "next/dynamic";
import { HeroSection } from "@/components/hero/hero-section";
import {
  ResearchAreasSkeleton,
  FeaturedToolsSkeleton,
  StatsSectionSkeleton,
  SelectedPublicationsSkeleton,
  CtaSectionSkeleton,
} from "@/components/home/home-skeletons";

// The hero (first paint) stays in the initial bundle. Every below-fold
// section is split into its own chunk with ssr:true: crawlers and first
// visits still get full server HTML (identical visuals, no CLS), but the
// section's client JS — Reveal/Parallax/TiltCard/MagneticButton wiring plus
// framer-motion-driven counters — loads only when the client needs it.
const ResearchAreas = dynamic(() => import("@/components/home/research-areas").then((m) => m.ResearchAreas), {
  ssr: true,
  loading: () => <ResearchAreasSkeleton />,
});
const FeaturedTools = dynamic(() => import("@/components/home/featured-tools").then((m) => m.FeaturedTools), {
  ssr: true,
  loading: () => <FeaturedToolsSkeleton />,
});
const StatsSection = dynamic(() => import("@/components/home/stats-section").then((m) => m.StatsSection), {
  ssr: true,
  loading: () => <StatsSectionSkeleton />,
});
const SelectedPublications = dynamic(
  () => import("@/components/home/selected-publications").then((m) => m.SelectedPublications),
  { ssr: true, loading: () => <SelectedPublicationsSkeleton /> }
);
const CtaSection = dynamic(() => import("@/components/home/cta-section").then((m) => m.CtaSection), {
  ssr: true,
  loading: () => <CtaSectionSkeleton />,
});

export default function Home() {
  return (
    <>
      <HeroSection />
      <ResearchAreas />
      <FeaturedTools />
      <StatsSection />
      <SelectedPublications />
      <CtaSection />
    </>
  );
}
