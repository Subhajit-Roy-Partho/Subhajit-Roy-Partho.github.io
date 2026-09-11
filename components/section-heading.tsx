import { Reveal } from "./reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <Reveal className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">{eyebrow}</p>
      <h2 className="font-display mt-3 text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-tight tracking-tight">
        {title}
      </h2>
      {description && <p className="mt-4 text-base text-[var(--muted)]">{description}</p>}
    </Reveal>
  );
}
