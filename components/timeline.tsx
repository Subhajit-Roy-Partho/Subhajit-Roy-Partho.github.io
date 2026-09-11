import type { ReactNode } from "react";
import { Reveal } from "./reveal";

export function TimelineItem({
  title,
  meta,
  period,
  children,
  index = 0,
}: {
  title: string;
  meta?: string;
  period?: string;
  children?: ReactNode;
  index?: number;
}) {
  return (
    <Reveal delay={Math.min(index * 0.06, 0.3)}>
      <div className="relative border-l border-[var(--border)] pl-8 pb-10 last:pb-0">
        <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_4px_var(--accent-soft)]" />
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          {period && <span className="text-xs uppercase tracking-wide text-[var(--muted)]">{period}</span>}
        </div>
        {meta && <p className="mt-1 text-sm text-[var(--accent)]">{meta}</p>}
        {children && <div className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{children}</div>}
      </div>
    </Reveal>
  );
}

export function Timeline({ children }: { children: ReactNode }) {
  return <div className="mt-10">{children}</div>;
}
