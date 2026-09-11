import type { Metadata } from "next";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { TiltCard } from "@/components/tilt-card";
import { experience } from "@/data/site";
import { projects } from "@/data/projects";

export const metadata: Metadata = { title: "Research" };

export default function ResearchPage() {
  return (
    <div className="pt-32">
      <section className="container-page section pt-0">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Research</p>
          <h1 className="font-display mt-4 max-w-2xl text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-tight tracking-tight">
            From force fields to foundation models for DNA.
          </h1>
        </Reveal>
      </section>

      <section className="container-page section pt-0">
        <SectionHeading eyebrow="Featured builds" title="Tools & platforms" />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {projects.map((project, i) => (
            <Reveal key={project.id} delay={(i % 2) * 0.06}>
              <TiltCard className="h-full">
                <h3 className="font-display text-xl font-semibold">{project.name}</h3>
                <p className="mt-1 text-sm text-[var(--accent)]">{project.tagline}</p>
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

      {experience.map((role) => (
        <section key={role.title + role.period} className="container-page section pt-0">
          <Reveal>
            <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[var(--border)] pb-6">
              <div>
                <h2 className="font-display text-2xl font-semibold">{role.title}</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {role.institution} · {role.advisor}
                </p>
              </div>
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">{role.period}</span>
            </div>
          </Reveal>

          <div className="mt-10 space-y-10">
            {role.categories.map((cat, i) => (
              <Reveal key={cat.heading} delay={i * 0.06}>
                <h3 className="font-display text-lg font-semibold text-[var(--accent)]">{cat.heading}</h3>
                <p className="mt-2 text-xs text-[var(--muted)]">{cat.skills}</p>
                <ul className="mt-4 space-y-2.5">
                  {cat.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-3 text-sm leading-relaxed text-[var(--muted)]">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
