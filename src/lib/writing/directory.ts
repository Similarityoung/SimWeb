import type { ArticleSummary, WritingKind } from "./types";

export type DirectoryQuery = {
  q: string;
  category?: string;
  tag?: string;
  page: number;
};

export type DirectoryPage = {
  query: DirectoryQuery;
  items: readonly ArticleSummary[];
  total: number;
  pageCount: number;
  order: "date" | "relevance";
};

export const DIRECTORY_PAGE_SIZE = 10;

function normalizedQuery(query: DirectoryQuery): DirectoryQuery {
  return {
    q: query.q.trim(),
    ...(query.category ? { category: query.category } : {}),
    ...(query.tag ? { tag: query.tag } : {}),
    page: Number.isSafeInteger(query.page) && query.page > 0 ? query.page : 1,
  };
}

function queryForKind(
  kind: WritingKind,
  query: DirectoryQuery,
): DirectoryQuery {
  const normalized = normalizedQuery(query);
  return kind === "thoughts" ? { q: "", page: normalized.page } : normalized;
}

export function readDirectoryQuery(
  kind: WritingKind,
  params: Pick<URLSearchParams, "get">,
): DirectoryQuery {
  const page = params.get("page") ?? "1";
  return queryForKind(kind, {
    q: params.get("q") ?? "",
    category: params.get("category") ?? undefined,
    tag: params.get("tag") ?? undefined,
    page: /^\d+$/.test(page) ? Number(page) : 1,
  });
}

export function directoryHref(
  kind: WritingKind,
  query: DirectoryQuery,
): string {
  const normalized = queryForKind(kind, query);
  const params = new URLSearchParams();
  if (normalized.q) params.set("q", normalized.q);
  if (normalized.category) params.set("category", normalized.category);
  if (normalized.tag) params.set("tag", normalized.tag);
  if (normalized.page > 1) params.set("page", String(normalized.page));
  const search = params.toString();
  return `/${kind}${search ? `?${search}` : ""}`;
}

export function paginateDirectory<T>(
  items: readonly T[],
  query: DirectoryQuery,
): {
  query: DirectoryQuery;
  items: readonly T[];
  total: number;
  pageCount: number;
} {
  const normalized = normalizedQuery(query);
  const total = items.length;
  const pageCount = Math.ceil(total / DIRECTORY_PAGE_SIZE);
  const page = Math.min(normalized.page, Math.max(pageCount, 1));
  const start = (page - 1) * DIRECTORY_PAGE_SIZE;
  return {
    query: { ...normalized, page },
    items: items.slice(start, start + DIRECTORY_PAGE_SIZE),
    total,
    pageCount,
  };
}

export function browseDirectory(
  articles: readonly ArticleSummary[],
  kind: WritingKind,
  query: DirectoryQuery,
): DirectoryPage {
  const normalized = queryForKind(kind, query);
  if (normalized.q)
    throw new Error("Keyword searches require the directory search module");

  const matches = articles
    .filter(
      (article) =>
        article.kind === kind &&
        (!normalized.category ||
          article.categories.includes(normalized.category)) &&
        (!normalized.tag || article.tags.includes(normalized.tag)),
    )
    .sort(
      (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id, "en"),
    );
  return { ...paginateDirectory(matches, normalized), order: "date" };
}

export function directoryFacets(
  articles: readonly ArticleSummary[],
  kind: WritingKind,
): {
  categories: { value: string; count: number }[];
  tags: { value: string; count: number }[];
} {
  const categories = new Map<string, number>();
  const tags = new Map<string, number>();
  for (const article of articles) {
    if (article.kind !== kind) continue;
    for (const category of new Set(article.categories))
      categories.set(category, (categories.get(category) ?? 0) + 1);
    for (const tag of new Set(article.tags))
      tags.set(tag, (tags.get(tag) ?? 0) + 1);
  }
  const sorted = (counts: Map<string, number>) =>
    [...counts]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value, "en"));
  return { categories: sorted(categories), tags: sorted(tags) };
}
