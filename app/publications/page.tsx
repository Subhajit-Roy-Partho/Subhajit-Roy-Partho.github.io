import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { PublicationItem } from "@/components/publication-item";
import { publications } from "@/data/publications";

export const metadata: Metadata = { title: "Publications" };

export default function PublicationsPage() {
  const years = Array.from(new Set(publications.map((p) => p.year))).sort((a, b) => b - a);

  return (
    <div className="pt-32">
      <section className="container-page section pt-0">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Publications</p>
          <h1 className="font-display mt-4 max-w-2xl text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-tight tracking-tight">
            Papers &amp; preprints
          </h1>
          <p className="mt-4 max-w-xl text-[var(--muted)]">
            In reverse-chronological order. My name is bolded within the author list on each entry.
          </p>
        </Reveal>

        {years.map((year) => (
          <div key={year} className="mt-14 first:mt-12">
            <Reveal>
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                {year}
              </h2>
            </Reveal>
            <div className="mt-6 grid gap-5">
              {publications
                .filter((p) => p.year === year)
                .map((pub, i) => (
                  <Reveal key={pub.id} delay={i * 0.05}>
                    <PublicationItem publication={pub} />
                  </Reveal>
                ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
