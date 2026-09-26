import "server-only";
import {
  readPublishedArticles,
  type PublishedArticle,
} from "@/lib/writing/catalog";
import path from "node:path";

const ignored = new Set([
  "a",
  "about",
  "and",
  "are",
  "can",
  "do",
  "for",
  "how",
  "i",
  "in",
  "is",
  "me",
  "my",
  "notes",
  "of",
  "on",
  "projects",
  "the",
  "thoughts",
  "to",
  "what",
  "your",
  "you",
  "关于",
  "哪些",
  "什么",
  "介绍",
  "文章",
  "笔记",
  "有关",
  "怎么",
  "如何",
]);

function queryTerms(query: string): string[] {
  return [
    ...new Intl.Segmenter(undefined, { granularity: "word" }).segment(query),
  ]
    .filter((part) => part.isWordLike)
    .map((part) => part.segment.toLowerCase())
    .filter((term) => term.length > 1 && !ignored.has(term));
}

function bestExcerpt(body: string, terms: readonly string[]): string {
  const text = body.replace(/!\[[^\]]*\]\([^)]+\)/g, "");
  const lower = text.toLowerCase();
  const starts = terms
    .map((term) => lower.indexOf(term))
    .filter((index) => index >= 0)
    .map((index) => Math.max(0, index - 220));
  if (!starts.length) return text.slice(0, 900);
  const start = starts.reduce((best, candidate) => {
    const coverage = (at: number) =>
      terms.filter((term) => lower.slice(at, at + 900).includes(term)).length;
    return coverage(candidate) > coverage(best) ? candidate : best;
  });
  return text.slice(start, start + 900);
}

export function rankArticles(
  query: string,
  published: readonly PublishedArticle[],
): { article: PublishedArticle; excerpt: string }[] {
  const terms = queryTerms(query);
  if (!terms.length) return [];
  return published
    .map((article) => {
      const { title, summary, tags, body } = article.article;
      const lower = [title, summary, tags.join(" "), body].map((part) =>
        part.toLowerCase(),
      );
      const score = terms.reduce(
        (total, term) =>
          total +
          (lower[0].includes(term) ? 8 : 0) +
          (lower[1].includes(term) ? 4 : 0) +
          (lower[2].includes(term) ? 4 : 0) +
          (lower[3].includes(term) ? 1 : 0),
        0,
      );
      return { article, score, excerpt: bestExcerpt(body, terms) };
    })
    .filter(({ score }) => score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.article.article.date.localeCompare(a.article.article.date),
    )
    .filter(({ score }, _, ranked) =>
      ranked[0].score < 5 ? true : score >= ranked[0].score / 5,
    )
    .slice(0, 3)
    .map(({ article, excerpt }) => ({ article, excerpt }));
}

export function relevantArticles(query: string) {
  return rankArticles(
    query,
    readPublishedArticles(path.join(process.cwd(), "content")),
  );
}
