import type { Metadata } from "next";
import { Reveal } from "@/components/reveal";
import { PostList } from "@/components/blog/post-list";
import { getAllPosts, getAllTags } from "@/lib/blog";

export const metadata: Metadata = { title: "Blog" };

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <div className="pt-32">
      <section className="container-page section pt-0">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--accent)]">Writing</p>
          <h1 className="font-display mt-4 max-w-2xl text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-tight tracking-tight">
            Notes on Linux, HPC, and DNA simulation
          </h1>
          <p className="mt-4 max-w-xl text-[var(--muted)]">
            Practical write-ups from setting up clusters and running oxDNA — mostly so future-me doesn&apos;t have to
            remember it twice.
          </p>
        </Reveal>

        <div className="mt-12">
          <PostList posts={posts} tags={tags} />
        </div>
      </section>
    </div>
  );
}
