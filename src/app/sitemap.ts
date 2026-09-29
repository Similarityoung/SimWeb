import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { getArticleSummaries } from "@/lib/writing/content.server";

export default function sitemap(): MetadataRoute.Sitemap {
  return [...site.navigation, ...getArticleSummaries()].map(({ href }) => ({
    url: new URL(href, site.url).toString(),
  }));
}
