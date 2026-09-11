import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  categories: string[];
  cover?: string;
  draft?: boolean;
  toc?: boolean;
  readingTime: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function readSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export function getPostSource(slug: string): { meta: PostMeta; content: string } {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const meta: PostMeta = {
    slug,
    title: data.title ?? slug,
    date: data.date ? new Date(data.date).toISOString() : new Date(0).toISOString(),
    description: data.description ?? "",
    tags: data.tags ?? [],
    categories: data.categories ?? [],
    cover: data.cover,
    draft: Boolean(data.draft),
    toc: data.toc !== false,
    readingTime: readingTime(content).text,
  };

  return { meta, content };
}

export function getAllPosts(): PostMeta[] {
  return readSlugs()
    .map((slug) => getPostSource(slug).meta)
    .filter((meta) => !meta.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getAllSlugs(): string[] {
  return getAllPosts().map((p) => p.slug);
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  getAllPosts().forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}
