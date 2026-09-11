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
  const { title, authors, venue, year, status, link } = publication;

  const Wrapper = link ? "a" : "div";
  const wrapperProps = link ? { href: link, target: "_blank", rel: "noopener noreferrer" } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={`card-surface block p-6 transition-colors ${link ? "hover:border-[var(--accent)]" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        <span>{year}</span>
        <span aria-hidden>·</span>
        <span>{venue}</span>
        {status && (
          <span className="chip !py-0.5 !text-[0.65rem]">{STATUS_LABEL[status]}</span>
        )}
      </div>
      <h3 className="font-display mt-3 text-lg font-semibold leading-snug">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">
        <AuthorLine authors={authors} />
      </p>
    </Wrapper>
  );
}
