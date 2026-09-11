import { HeroSection } from "@/components/hero/hero-section";
import { ResearchAreas } from "@/components/home/research-areas";
import { FeaturedTools } from "@/components/home/featured-tools";
import { StatsSection } from "@/components/home/stats-section";
import { SelectedPublications } from "@/components/home/selected-publications";
import { CtaSection } from "@/components/home/cta-section";

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
