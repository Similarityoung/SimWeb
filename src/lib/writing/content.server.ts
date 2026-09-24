import "server-only";
import path from "node:path";
import { readPublishedArticles } from "./catalog";
import type { Article, ArticleSummary, WritingKind } from "./types";

function articles(): Article[] {
  return readPublishedArticles(path.join(process.cwd(), "content")).map(
    ({ article }) => article,
  );
}

export function getArticleSummaries(kind?: WritingKind): ArticleSummary[] {
  return articles()
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
  return articles().find(
    (article) => article.kind === kind && article.slug === slug,
  );
}
