import { SectionHeading } from "../section-heading";
import { Reveal } from "../reveal";
import { TiltCard } from "../tilt-card";
import { projects } from "@/data/projects";

export function FeaturedTools() {
  return (
    <section className="section container-page">
      <SectionHeading
        eyebrow="Tools & platforms"
        title="Software I've built and maintain"
        description="From a coarse-grained simulation engine to LLM agents that design DNA origami, these are the systems behind the research."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {projects.map((project, i) => (
          <Reveal key={project.id} delay={(i % 2) * 0.08}>
            <TiltCard className="h-full">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-semibold">{project.name}</h3>
                  <p className="mt-1 text-sm text-[var(--accent)]">{project.tagline}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">{project.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
            </TiltCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
