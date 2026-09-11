import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { MagneticButton } from "@/components/magnetic-button";
import {
  profile,
  education,
  experience,
  skillGroups,
  awards,
  presentations,
  service,
} from "@/data/site";

export const metadata: Metadata = { title: "CV" };

function CvSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal>
      <section className="border-t border-[var(--border)] py-10 first:border-none first:pt-0">
        <h2 className="font-display text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">
          {title}
        </h2>
        <div className="mt-5">{children}</div>
      </section>
    </Reveal>
  );
}

export default function CvPage() {
  return (
    <div className="pt-32">
      <div className="container-page section max-w-3xl pt-0">
        <Reveal className="pb-10">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Curriculum Vitae</p>
              <h1 className="font-display mt-4 text-[clamp(1.9rem,4vw,2.75rem)] font-semibold tracking-tight">
                {profile.name}
              </h1>
              <p className="mt-2 text-[var(--muted)]">{profile.role} · {profile.affiliation}</p>
            </div>
            <MagneticButton href="/cv/CV.pdf" external>
              Download PDF
            </MagneticButton>
          </div>
        </Reveal>

        <CvSection title="Summary">
          <p className="text-sm leading-relaxed text-[var(--muted)]">{profile.summary}</p>
        </CvSection>

        <CvSection title="Education">
          <div className="space-y-6">
            {education.map((ed) => (
              <div key={ed.degree} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div>
                  <p className="font-display font-semibold">{ed.degree}</p>
                  <p className="text-sm text-[var(--muted)]">{ed.institution}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{ed.detail}</p>
                </div>
                <div className="text-right text-xs text-[var(--muted)]">
                  <p>{ed.period}</p>
                  {ed.extra && <p className="mt-1">{ed.extra}</p>}
                </div>
              </div>
            ))}
          </div>
        </CvSection>

        <CvSection title="Experience">
          <div className="space-y-8">
            {experience.map((role) => (
              <div key={role.title + role.period}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="font-display font-semibold">
                    {role.title} — {role.institution}
                  </p>
                  <span className="text-xs text-[var(--muted)]">{role.period}</span>
                </div>
                <p className="text-xs text-[var(--muted)]">{role.advisor}</p>
                <div className="mt-3 space-y-4">
                  {role.categories.map((cat) => (
                    <div key={cat.heading}>
                      <p className="text-sm font-medium text-[var(--foreground)]">{cat.heading}</p>
                      <ul className="mt-1.5 space-y-1.5">
                        {cat.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-2 text-sm text-[var(--muted)]">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CvSection>

        <CvSection title="Technical skills">
          <div className="grid gap-4 sm:grid-cols-2">
            {skillGroups.map((group) => (
              <div key={group.label}>
                <p className="text-sm font-medium">{group.label}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{group.items}</p>
              </div>
            ))}
          </div>
        </CvSection>

        <CvSection title="Awards & honors">
          <ul className="space-y-2">
            {awards.map((a) => (
              <li key={a} className="text-sm text-[var(--muted)]">
                {a}
              </li>
            ))}
          </ul>
        </CvSection>

        <CvSection title="Presentations & conferences">
          <ul className="space-y-2">
            {presentations.map((p) => (
              <li key={p} className="text-sm text-[var(--muted)]">
                {p}
              </li>
            ))}
          </ul>
        </CvSection>

        <CvSection title="Service & outreach">
          <ul className="space-y-2">
            {service.map((s) => (
              <li key={s} className="text-sm text-[var(--muted)]">
                {s}
              </li>
            ))}
          </ul>
        </CvSection>
      </div>
    </div>
  );
}
