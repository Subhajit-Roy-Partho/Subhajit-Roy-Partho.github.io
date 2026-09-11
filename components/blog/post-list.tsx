"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Reveal } from "../reveal";
import type { PostMeta } from "@/lib/blog";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function PostList({ posts, tags }: { posts: PostMeta[]; tags: string[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filtered = useMemo(
    () => (activeTag ? posts.filter((p) => p.tags.includes(activeTag)) : posts),
    [posts, activeTag]
  );

  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={`chip transition-colors ${activeTag === null ? "border-[var(--accent)] text-[var(--accent)]" : ""}`}
          >
            All
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`chip transition-colors ${activeTag === tag ? "border-[var(--accent)] text-[var(--accent)]" : ""}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10 grid gap-5">
        {filtered.map((post, i) => (
          <Reveal key={post.slug} delay={Math.min(i * 0.05, 0.3)}>
            <Link href={`/blog/${post.slug}`} className="card-surface block p-6 transition-colors hover:border-[var(--accent)]">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                <span>{formatDate(post.date)}</span>
                <span aria-hidden>·</span>
                <span>{post.readingTime}</span>
              </div>
              <h2 className="font-display mt-3 text-xl font-semibold">{post.title}</h2>
              <p className="mt-2 text-sm text-[var(--muted)]">{post.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="chip !py-0.5 !text-[0.65rem]">
                    #{tag}
                  </span>
                ))}
              </div>
            </Link>
          </Reveal>
        ))}

        {filtered.length === 0 && <p className="text-sm text-[var(--muted)]">No posts with that tag yet.</p>}
      </div>
    </div>
  );
}
