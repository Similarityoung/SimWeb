import "server-only";
import path from "node:path";
import { cache } from "react";
import { readPublishedArticles, type PublishedArticle } from "./catalog";
import type { ArticlePage, ArticleSummary, WritingKind } from "./types";

export const getPublishedArticles = cache((): PublishedArticle[] =>
  readPublishedArticles(path.join(process.cwd(), "content")),
);

const getSummaries = cache((): ArticleSummary[] =>
  getPublishedArticles().map(({ article: { body, ...summary } }) => {
    void body;
    return summary;
  }),
);

export function getArticleSummaries(kind?: WritingKind): ArticleSummary[] {
  const summaries = getSummaries();
  return kind
    ? summaries.filter((article) => article.kind === kind)
    : summaries;
}

export function getArticle(
  kind: WritingKind,
  slug: string,
): ArticlePage | undefined {
  const published = getPublishedArticles();
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
