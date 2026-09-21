import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { TiltCard } from "@/components/tilt-card";
import { extras } from "@/data/extras";

export const metadata: Metadata = { title: "Extras" };

export default function ExtrasPage() {
  return (
    <div className="pt-32">
      <section className="container-page section pt-0">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Extras</p>
          <h1 className="font-display mt-4 max-w-2xl text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-tight tracking-tight">
            Non-academic projects.
          </h1>
          <p className="mt-4 max-w-xl text-[var(--muted)]">
            Teaching tools and side projects built outside the lab — interactive demos, everyday apps, and open-source
            experiments.
          </p>
        </Reveal>
      </section>

      <section className="container-page section pt-0">
        <SectionHeading
          eyebrow="Side projects"
          title="Everything outside the research page"
          description="One of these runs right here on this site; the others live on their own deployments."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {extras.map((extra, i) => {
            const CardBody = (
              <TiltCard className="h-full">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl font-semibold">{extra.name}</h3>
                    <p className="mt-1 text-sm text-[var(--accent)]">{extra.tagline}</p>
                  </div>
                  <span className="chip !py-0.5 !text-[0.65rem] shrink-0">{extra.status}</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">{extra.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {extra.tags.map((tag) => (
                    <span key={tag} className="chip">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-medium">
                  <span className="text-[var(--foreground)]">
                    {extra.comingSoon ? "Preview soon " : extra.external ? "Open live " : "Open "}
                    <span aria-hidden>→</span>
                  </span>
                  {extra.repoLink && (
                    <span className="text-[var(--muted)] underline-offset-4 hover:underline">
                      {extra.repoLink.label} →
                    </span>
                  )}
                </div>
              </TiltCard>
            );

            return (
              <Reveal key={extra.id} delay={(i % 2) * 0.06}>
                {extra.external || extra.comingSoon ? (
                  <a
                    href={extra.href}
                    target={extra.external ? "_blank" : undefined}
                    rel={extra.external ? "noopener noreferrer" : undefined}
                    className="block h-full"
                  >
                    {CardBody}
                  </a>
                ) : (
                  <Link href={extra.href} className="block h-full">
                    {CardBody}
                  </Link>
                )}
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="container-page section pt-0">
        <div className="card-surface flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Looking for the research tools?</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              oxDNA, oxView, fastDNA and the rest live on the research page.
            </p>
          </div>
          <Link
            href="/research"
            className="shrink-0 rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium hover:text-[var(--accent)]"
          >
            Go to research →
          </Link>
        </div>
      </section>
    </div>
  );
}
