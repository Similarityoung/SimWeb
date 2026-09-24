import "server-only";
import path from "node:path";
import { readPublishedArticles, type PublishedArticle } from "./catalog";
import type { ArticlePage, ArticleSummary, WritingKind } from "./types";

function articles(): PublishedArticle[] {
  return readPublishedArticles(path.join(process.cwd(), "content"));
}

export function getArticleSummaries(kind?: WritingKind): ArticleSummary[] {
  return articles()
    .map(({ article }) => article)
    .filter((article) => !kind || article.kind === kind)
    .map(({ body, ...summary }) => {
      void body;
      return summary;
    });
}

export function getArticle(
  kind: WritingKind,
  slug: string,
): ArticlePage | undefined {
  const published = articles();
  const match = published.find(
    ({ article }) => article.kind === kind && article.slug === slug,
  );
  if (!match) return undefined;

  return {
    ...match.article,
    wikiLinkTargets: Object.fromEntries(
      published.map(({ file, article }) => [
        file.slice(0, -3).split(path.sep).join("/"),
        article.href,
      ]),
    ),
  };
}
