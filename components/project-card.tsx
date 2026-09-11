import Link from "next/link";
import { TiltCard } from "./tilt-card";
import type { Project } from "@/data/projects";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/research/${project.id}`} className="block h-full">
      <TiltCard className="h-full">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-semibold">{project.name}</h3>
            <p className="mt-1 text-sm text-[var(--accent)]">{project.tagline}</p>
          </div>
          {project.liveLink && (
            <span className="chip !py-0.5 !text-[0.65rem] shrink-0">{project.status.split(" · ")[0]}</span>
          )}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">{project.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-5 text-sm font-medium text-[var(--foreground)]">
          Read the story <span aria-hidden>→</span>
        </p>
      </TiltCard>
    </Link>
  );
}
