import type { Metadata } from "next";
import Image from "next/image";
import { SectionHeading } from "@/components/section-heading";
import { Reveal } from "@/components/reveal";
import { Timeline, TimelineItem } from "@/components/timeline";
import {
  profile,
  education,
  awards,
  presentations,
  service,
  additionalProjects,
} from "@/data/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="pt-32">
      <section className="container-page section pt-0">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr] md:items-center">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">About</p>
            <h1 className="font-display mt-4 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-tight tracking-tight">
              {profile.name}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--muted)]">{profile.summary}</p>
            <p className="mt-4 text-sm text-[var(--muted)]">{profile.location}</p>
          </Reveal>
          <Reveal delay={0.1} className="justify-self-center">
            <div className="card-surface relative aspect-[4/5] w-56 overflow-hidden sm:w-64">
              <Image
                src="/images/profile.jpg"
                alt={profile.name}
                fill
                sizes="256px"
                className="object-cover"
                priority
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-page section pt-0">
        <SectionHeading eyebrow="Education" title="Academic background" />
        <Timeline>
          {education.map((ed, i) => (
            <TimelineItem key={ed.degree} title={ed.degree} meta={ed.institution} period={ed.period} index={i}>
              <p>{ed.detail}</p>
              {ed.extra && <p className="mt-1 text-xs text-[var(--muted)]">{ed.extra}</p>}
            </TimelineItem>
          ))}
        </Timeline>
      </section>

      <section className="container-page section pt-0">
        <SectionHeading eyebrow="Recognition" title="Awards & honors" />
        <Timeline>
          {awards.map((a, i) => (
            <TimelineItem key={a} title={a} index={i} />
          ))}
        </Timeline>
      </section>

      <section className="container-page section pt-0">
        <SectionHeading eyebrow="Talks" title="Presentations & conferences" />
        <Timeline>
          {presentations.map((p, i) => (
            <TimelineItem key={p} title={p} index={i} />
          ))}
        </Timeline>
      </section>

      <section className="container-page section pt-0">
        <SectionHeading eyebrow="Community" title="Service & outreach" />
        <Timeline>
          {service.map((s, i) => (
            <TimelineItem key={s} title={s} index={i} />
          ))}
        </Timeline>
      </section>

      <section className="container-page section pt-0">
        <SectionHeading
          eyebrow="Before the PhD"
          title="Additional projects"
          description="A handful of things built during the BS-MS years, outside of biophysics."
        />
        <Timeline>
          {additionalProjects.map((p, i) => (
            <TimelineItem key={p} title={p} index={i} />
          ))}
        </Timeline>
      </section>
    </div>
  );
}
