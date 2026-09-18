import type { MetadataRoute } from "next";
import { profile } from "@/data/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${profile.links.portfolio}/sitemap.xml`,
  };
}