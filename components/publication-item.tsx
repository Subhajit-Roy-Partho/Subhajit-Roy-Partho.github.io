import Image from "next/image";
import type { Publication } from "@/data/publications";

function AuthorLine({ authors }: { authors: string }) {
  const parts = authors.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-[var(--foreground)]">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

const STATUS_LABEL: Record<NonNullable<Publication["status"]>, string> = {
  "under review": "Under review",
  accepted: "Accepted",
  preprint: "Preprint",
};

export function PublicationItem({ publication }: { publication: Publication }) {
  const { title, authors, venue, year, status, link, cover } = publication;

  const Wrapper = link ? "a" : "div";
  const wrapperProps = link ? { href: link, target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`card-surface group block p-6 transition-colors ${link ? "hover:border-[var(--accent)]" : ""}`}
    >
      <div className={cover ? "flex gap-5" : ""}>
        {cover && (
          <div className="relative hidden h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[#f4f5f7] sm:block">
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              sizes="96px"
              className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span>{year}</span>
            <span aria-hidden>·</span>
            <span>{venue}</span>
            {status && <span className="chip !py-0.5 !text-[0.65rem]">{STATUS_LABEL[status]}</span>}
          </div>
          <h3 className="font-display mt-3 text-lg font-semibold leading-snug">{title}</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            <AuthorLine authors={authors} />
          </p>
        </div>
      </div>
    </Wrapper>
  );
}
