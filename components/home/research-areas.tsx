import { SectionHeading } from "../section-heading";
import { Reveal } from "../reveal";
import { TiltCard } from "../tilt-card";
import { researchAreas } from "@/data/projects";

const ICONS: Record<string, string> = {
  ml: "M13 2 3 14h7l-1 8 10-12h-7z",
  simulation: "M12 2a5 5 0 0 1 5 5c0 2-1 3-2 4l-1 1v3a2 2 0 0 1-4 0v-3l-1-1c-1-1-2-2-2-4a5 5 0 0 1 5-5Zm-4 17h8",
  infrastructure: "M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01",
};

export function ResearchAreas() {
  return (
    <section className="section container-page">
      <SectionHeading
        eyebrow="What I work on"
        title="Three threads, one goal: programmable matter"
        description="Machine learning, molecular simulation, and the infrastructure that connects computation back to the bench."
      />

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {researchAreas.map((area, i) => (
          <Reveal key={area.key} delay={i * 0.08}>
            <TiltCard className="h-full">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
                <path d={ICONS[area.key]} />
              </svg>
              <h3 className="font-display mt-5 text-lg font-semibold">{area.title}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{area.blurb}</p>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
