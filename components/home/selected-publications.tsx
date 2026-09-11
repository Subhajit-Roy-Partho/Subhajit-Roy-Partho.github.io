import Link from "next/link";
import { SectionHeading } from "../section-heading";
import { Reveal } from "../reveal";
import { Parallax } from "../parallax";
import { PublicationItem } from "../publication-item";
import { publications } from "@/data/publications";

export function SelectedPublications() {
  const latest = publications.slice(0, 4);

  return (
    <section className="section container-page">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading eyebrow="Selected work" title="Recent publications" />
        <Link href="/publications" className="text-sm text-[var(--accent)] hover:underline">
          View all publications →
        </Link>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {latest.map((pub, i) => (
          <Reveal key={pub.id} delay={(i % 2) * 0.08}>
            <Parallax offset={i % 2 === 0 ? 16 : -16}>
              <PublicationItem publication={pub} />
            </Parallax>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
