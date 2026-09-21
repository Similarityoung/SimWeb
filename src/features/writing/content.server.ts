import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { entries } from "./entries";
import type { Article, ArticleSummary, WritingKind } from "./types";

function readArticles(): Article[] {
  const ids = new Set<string>();
  const routes = new Set<string>();

  return entries
    .map((entry) => {
      const href = `/${entry.kind}/${entry.slug}`;
      if (ids.has(entry.id) || routes.has(href)) {
        throw new Error(`Duplicate article ID or route: ${entry.id}`);
      }
      ids.add(entry.id);
      routes.add(href);
      const { data, content } = matter(
        readFileSync(
          path.join(process.cwd(), "content/posts", entry.file),
          "utf8",
        ),
      );
      if (data.draft !== false)
        throw new Error(
          `Selected article must explicitly set draft: false: ${entry.file}`,
        );
      if (typeof data.title !== "string" || !data.title.trim())
        throw new Error(`Missing article title: ${entry.file}`);
      const date =
        data.date instanceof Date ? data.date : new Date(String(data.date));
      if (Number.isNaN(date.getTime()))
        throw new Error(`Invalid article date: ${entry.file}`);
      if (
        !Array.isArray(data.tags) ||
        !data.tags.every((tag: unknown) => typeof tag === "string")
      ) {
        throw new Error(`Invalid article tags: ${entry.file}`);
      }
      return {
        id: entry.id,
        slug: entry.slug,
        kind: entry.kind,
        summary: entry.summary,
        title: data.title,
        date: date.toISOString(),
        tags: data.tags,
        href,
        body: content,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getArticleSummaries(kind?: WritingKind): ArticleSummary[] {
  return readArticles()
    .filter((article) => !kind || article.kind === kind)
    .map(({ body, ...summary }) => {
      void body;
      return summary;
    });
}

export function getArticle(
  kind: WritingKind,
  slug: string,
): Article | undefined {
  return readArticles().find(
    (article) => article.kind === kind && article.slug === slug,
  );
}
