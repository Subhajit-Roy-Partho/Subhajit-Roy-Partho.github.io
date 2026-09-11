import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { ReactNode } from "react";

function slugify(children: ReactNode): string {
  return String(children)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function Heading(Tag: "h2" | "h3" | "h4") {
  const HeadingComponent = ({ children }: { children: ReactNode }) => {
    const id = slugify(children);
    return (
      <Tag id={id} className="group scroll-mt-28">
        <a href={`#${id}`} className="no-underline hover:underline">
          {children}
        </a>
      </Tag>
    );
  };
  HeadingComponent.displayName = `MdxHeading_${Tag}`;
  return HeadingComponent;
}

export function Callout({
  type = "note",
  children,
}: {
  type?: "note" | "tip" | "warning";
  children: ReactNode;
}) {
  const styles = {
    note: "border-accent/40 bg-accent/5 text-foreground",
    tip: "border-emerald-400/40 bg-emerald-400/5 text-foreground",
    warning: "border-amber-400/40 bg-amber-400/5 text-foreground",
  } as const;
  const labels = { note: "Note", tip: "Tip", warning: "Warning" } as const;

  return (
    <div className={`callout rounded-xl border px-5 py-4 my-6 text-sm leading-relaxed ${styles[type]}`}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide opacity-70">{labels[type]}</p>
      {children}
    </div>
  );
}

export const mdxComponents: MDXComponents = {
  h2: Heading("h2"),
  h3: Heading("h3"),
  h4: Heading("h4"),
  a: (props) => {
    const href = props.href ?? "";
    const isInternal = href.startsWith("/") || href.startsWith("#");
    if (isInternal) {
      return <Link href={href} {...props} />;
    }
    return <a target="_blank" rel="noopener noreferrer" {...props} />;
  },
  Callout,
};
