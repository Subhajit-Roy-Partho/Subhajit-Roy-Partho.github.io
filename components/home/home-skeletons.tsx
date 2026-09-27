/* CLS-safe loading placeholders for the homepage's below-fold sections.
   Rendered only during client-side navigation while a lazily-split section
   chunk loads (initial visits get server HTML, so these never shift layout).
   Each skeleton mirrors its section's real structure and approximate height
   using the site's own card-surface / chip language, with aria-hidden so
   assistive tech ignores the transient state. */

function Bars({ className }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-[var(--border)]/60 ${className ?? ""}`} />;
}

function SectionHeadSkeleton() {
  return (
    <div aria-hidden className="max-w-xl">
      <Bars className="h-3 w-28" />
      <Bars className="mt-4 h-8 w-4/5" />
      <Bars className="mt-3 h-4 w-3/5" />
    </div>
  );
}

export function ResearchAreasSkeleton() {
  return (
    <section className="section container-page" aria-hidden>
      <div className="flex flex-wrap items-center justify-between gap-8">
        <SectionHeadSkeleton />
        <div className="h-48 w-48 shrink-0 animate-pulse rounded-full bg-[var(--accent-soft)]/50" />
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card-surface h-52 p-6">
            <Bars className="h-7 w-7 !rounded-full" />
            <Bars className="mt-5 h-5 w-2/3" />
            <Bars className="mt-3 h-4 w-full" />
            <Bars className="mt-2 h-4 w-4/5" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeaturedToolsSkeleton() {
  return (
    <section className="section container-page" aria-hidden>
      <SectionHeadSkeleton />
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="card-surface h-64 p-6">
            <Bars className="h-6 w-1/2" />
            <Bars className="mt-3 h-4 w-full" />
            <Bars className="mt-2 h-4 w-5/6" />
            <div className="mt-5 flex gap-2">
              <Bars className="h-6 w-16 !rounded-full" />
              <Bars className="h-6 w-20 !rounded-full" />
              <Bars className="h-6 w-14 !rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function StatsSectionSkeleton() {
  return (
    <section className="section container-page" aria-hidden>
      <div className="card-surface grid grid-cols-2 gap-8 p-8 sm:grid-cols-4 sm:p-10">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <Bars className="mx-auto h-9 w-20 sm:mx-0" />
            <Bars className="mx-auto mt-3 h-3 w-24 sm:mx-0" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function SelectedPublicationsSkeleton() {
  return (
    <section className="section container-page" aria-hidden>
      <SectionHeadSkeleton />
      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card-surface h-44 p-6">
            <Bars className="h-5 w-4/5" />
            <Bars className="mt-3 h-4 w-3/5" />
            <Bars className="mt-2 h-4 w-2/5" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function CtaSectionSkeleton() {
  return (
    <section className="section container-page" aria-hidden>
      <div className="card-surface glow-ring min-h-48 p-10 sm:p-14">
        <Bars className="h-8 w-2/3" />
        <Bars className="mt-4 h-4 w-1/2" />
        <div className="mt-6 flex gap-4">
          <Bars className="h-11 w-32 !rounded-full" />
          <Bars className="h-11 w-32 !rounded-full" />
        </div>
      </div>
    </section>
  );
}
