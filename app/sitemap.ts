import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/lib/blog";
import { profile } from "@/data/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = profile.links.portfolio;
  const staticRoutes = ["", "/about", "/research", "/publications", "/cv", "/blog"];
  const blogRoutes = getAllSlugs().map((slug) => `/blog/${slug}`);

  return [...staticRoutes, ...blogRoutes].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
