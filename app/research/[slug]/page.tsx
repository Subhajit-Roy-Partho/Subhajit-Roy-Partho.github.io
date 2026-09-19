import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/reveal";
import { MagneticButton } from "@/components/magnetic-button";
import { ProjectIllustration } from "@/components/projects/illustration";
import { PublicationItem } from "@/components/publication-item";
import { projects, getProject } from "@/data/projects";
import { publications } from "@/data/publications";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return { title: "Project not found" };
  return { title: project.name, description: project.description };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const relatedPubs = publications.filter((p) => project.publicationIds?.includes(p.id));

  return (
    <div className="pt-32">
      <div className="container-page section max-w-3xl pt-0">
        <Reveal>
          <Link href="/research" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
            ← All projects
          </Link>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
            {project.status}
          </p>
          <h1 className="font-display mt-3 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-tight tracking-tight">
            {project.name}
          </h1>
          <p className="mt-3 text-lg text-[var(--muted)]">{project.tagline}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag} className="chip">
                {tag}
              </span>
            ))}
          </div>

          {(project.liveLink || project.repoLink) && (
            <div className="mt-8 flex flex-wrap gap-4">
              {project.liveLink && (
                <MagneticButton href={project.liveLink.href} external>
                  {project.liveLink.label}
                </MagneticButton>
              )}
              {project.repoLink && (
                <MagneticButton href={project.repoLink.href} variant="outline" external>
                  {project.repoLink.label}
                </MagneticButton>
              )}
            </div>
          )}
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <ProjectIllustration id={project.id} />
        </Reveal>

        <div className="mt-14 space-y-12">
          {project.story.map((section, i) => (
            <Reveal key={section.heading} delay={Math.min(i * 0.06, 0.3)}>
              <h2 className="font-display text-xl font-semibold text-[var(--accent)]">{section.heading}</h2>
              <div className="mt-4 space-y-4">
                {section.body.map((para, j) => (
                  <p key={j} className="text-base leading-relaxed text-[var(--muted)]">
                    {para}
                  </p>
                ))}
              </div>
            </Reveal>
          ))}
        </div>

        {project.figure && (
          <Reveal delay={0.1} className="mt-14">
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)]">
              <div className="relative mx-auto aspect-square w-full max-w-md sm:aspect-square">
                <Image src={project.figure.src} alt={project.figure.alt} fill sizes="768px" className="object-contain p-6" />
              </div>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">{project.figure.caption}</p>
          </Reveal>
        )}

        {relatedPubs.length > 0 && (
          <div className="mt-16 border-t border-[var(--border)] pt-10">
            <Reveal>
              <h2 className="font-display text-lg font-semibold">Related publications</h2>
            </Reveal>
            <div className="mt-6 grid gap-5">
              {relatedPubs.map((pub, i) => (
                <Reveal key={pub.id} delay={i * 0.05}>
                  <PublicationItem publication={pub} />
                </Reveal>
              ))}
            </div>
          </div>
        )}

        <div className="mt-16 border-t border-[var(--border)] pt-10">
          <Link href="/research" className="text-sm font-medium text-[var(--accent)] hover:underline">
            ← Back to all projects
          </Link>
        </div>
      </div>
    </div>
  );
}
