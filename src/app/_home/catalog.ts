import type { ContentReference } from "@/lib/answer/schema";
import type { PublicCatalog, ResolvedContent } from "./types";

export function resolveReference(
  reference: ContentReference,
  catalog: PublicCatalog,
): ResolvedContent {
  if (reference.type === "project") {
    const item = catalog.projects.find(
      (project) => project.id === reference.id,
    );
    if (!item) throw new Error(`Unknown project reference: ${reference.id}`);
    return { type: "project", item };
  }
  const item = catalog.articles.find((article) => article.id === reference.id);
  if (!item) throw new Error(`Unknown article reference: ${reference.id}`);
  return { type: "article", item };
}

export function validateCatalog(catalog: PublicCatalog): void {
  for (const items of [catalog.projects, catalog.articles]) {
    if (new Set(items.map((item) => item.id)).size !== items.length)
      throw new Error("Duplicate content ID");
  }
}
