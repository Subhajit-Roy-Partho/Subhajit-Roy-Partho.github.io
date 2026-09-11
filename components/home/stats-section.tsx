import { Reveal } from "../reveal";
import { StatValue } from "../stats-counter";
import { stats } from "@/data/site";

export function StatsSection() {
  return (
    <section className="section container-page">
      <div className="card-surface grid grid-cols-2 gap-8 p-8 sm:grid-cols-4 sm:p-10">
        {stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.06} className="text-center sm:text-left">
            <p className="font-display text-3xl font-semibold sm:text-4xl">
              <StatValue value={stat.value} />
            </p>
            <p className="mt-2 text-xs uppercase tracking-wide text-[var(--muted)] sm:text-sm">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
