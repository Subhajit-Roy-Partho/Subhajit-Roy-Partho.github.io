import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/reveal";
import { MdxContent } from "@/components/mdx-content";
import { getAllSlugs, getPostSource } from "@/lib/blog";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!getAllSlugs().includes(slug)) return { title: "Post not found" };
  const { meta } = getPostSource(slug);
  return { title: meta.title, description: meta.description };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getAllSlugs().includes(slug)) notFound();

  const { meta, content } = getPostSource(slug);
  if (meta.draft) notFound();

  return (
    <article className="pt-32">
      <div className="container-page section max-w-3xl pt-0">
        <Reveal>
          <Link href="/blog" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
            ← All posts
          </Link>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span>{formatDate(meta.date)}</span>
            <span aria-hidden>·</span>
            <span>{meta.readingTime}</span>
          </div>
          <h1 className="font-display mt-3 text-[clamp(1.9rem,4.5vw,3rem)] font-semibold leading-tight tracking-tight">
            {meta.title}
          </h1>
          <p className="mt-4 text-[var(--muted)]">{meta.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {meta.tags.map((tag) => (
              <span key={tag} className="chip">
                #{tag}
              </span>
            ))}
          </div>
        </Reveal>

        <div className="prose-custom mt-12">
          <MdxContent source={content} />
        </div>
      </div>
    </article>
  );
}
