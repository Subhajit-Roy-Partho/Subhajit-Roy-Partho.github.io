import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/blog";
import { profile } from "@/data/site";
import { projects } from "@/data/projects";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = profile.links.portfolio;
  const staticRoutes = [
    "",
    "/about",
    "/research",
    "/publications",
    "/cv",
    "/blog",
    "/extras",
    "/extras/electrostatic-simulator",
  ];
  const blogRoutes = getAllSlugs().map((slug) => `/blog/${slug}`);
  const projectRoutes = projects.map((p) => `/research/${p.id}`);

  return [...staticRoutes, ...blogRoutes, ...projectRoutes].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
