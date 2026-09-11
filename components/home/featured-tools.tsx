import { SectionHeading } from "../section-heading";
import { Reveal } from "../reveal";
import { Parallax } from "../parallax";
import { ProjectCard } from "../project-card";
import { projects } from "@/data/projects";

export function FeaturedTools() {
  const featured = projects.filter((p) => p.featured);

  return (
    <section className="section container-page">
      <SectionHeading
        eyebrow="Tools & platforms"
        title="Software I've built and maintain"
        description="From a coarse-grained simulation engine to LLM agents that design DNA origami, these are the systems behind the research."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {featured.map((project, i) => (
          <Reveal key={project.id} delay={(i % 2) * 0.08}>
            <Parallax offset={i % 2 === 0 ? 22 : -22}>
              <ProjectCard project={project} />
            </Parallax>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
