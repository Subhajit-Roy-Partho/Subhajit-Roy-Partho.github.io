import { Reveal } from "../reveal";
import { MagneticButton } from "../magnetic-button";
import { profile } from "@/data/site";

export function CtaSection() {
  return (
    <section className="section container-page">
      <Reveal>
        <div className="card-surface glow-ring flex flex-col items-start gap-6 p-10 sm:flex-row sm:items-center sm:justify-between sm:p-14">
          <div>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">Let&apos;s build something with DNA.</h2>
            <p className="mt-3 max-w-md text-[var(--muted)]">
              Open to collaborations, talks, and questions about oxDNA, generative models for nucleic acids, or
              anything in between.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <MagneticButton href={`mailto:${profile.email}`} external>
              Say hello
            </MagneticButton>
            <MagneticButton href="/cv" variant="outline">
              View CV
            </MagneticButton>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
