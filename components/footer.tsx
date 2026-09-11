import Link from "next/link";
import { profile } from "@/data/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)]">
      <div className="container-page flex flex-col gap-6 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-base font-semibold">Subhajit Roy</p>
          <p className="mt-1 max-w-xs text-sm text-[var(--muted)]">
            {profile.role} · {profile.affiliation}
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <a href={`mailto:${profile.email}`} className="text-[var(--muted)] hover:text-[var(--accent)]">
            {profile.email}
          </a>
          <div className="flex gap-4">
            <a href={profile.links.github} target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--accent)]">
              GitHub
            </a>
            <a href={profile.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--accent)]">
              LinkedIn
            </a>
            <a href={profile.links.scholar} target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--accent)]">
              Scholar
            </a>
          </div>
        </div>
      </div>
      <div className="container-page flex flex-col gap-2 border-t border-[var(--border)] py-6 text-xs text-[var(--muted)] sm:flex-row sm:justify-between">
        <p>© {year} Subhajit Roy. Built with Next.js.</p>
        <Link href="/blog" className="hover:text-[var(--accent)]">
          Read the blog →
        </Link>
      </div>
    </footer>
  );
}
