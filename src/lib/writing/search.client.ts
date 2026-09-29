import {
  paginateDirectory,
  type DirectoryPage,
  type DirectoryQuery,
} from "./directory";
import type { ArticleSummary, WritingKind } from "./types";

type SearchHandle = {
  data(): Promise<{ url: string; meta: Record<string, string> }>;
};

type PagefindSearch = {
  search(
    query: string,
    options: { filters: Record<string, string> },
  ): Promise<{ results: readonly SearchHandle[] }>;
};

let loading: Promise<PagefindSearch> | undefined;

function loadPagefind(): Promise<PagefindSearch> {
  if (!loading) {
    const modulePath = "/pagefind/pagefind.js";
    loading = import(/* webpackIgnore: true */ modulePath).catch((error) => {
      loading = undefined;
      throw error;
    });
  }
  return loading;
}

export async function searchDirectory(
  articles: readonly ArticleSummary[],
  kind: WritingKind,
  query: DirectoryQuery,
): Promise<DirectoryPage> {
  const pagefind = await loadPagefind();
  const filters: Record<string, string> = { kind };
  if (query.category) filters.category = query.category;
  if (query.tag) filters.tag = query.tag;
  const search = await pagefind.search(query.q, { filters });
  const page = paginateDirectory(search.results, query);
  const catalog = new Map(articles.map((article) => [article.id, article]));
  const items = await Promise.all(
    page.items.map(async (handle) => {
      const data = await handle.data();
      const article = catalog.get(data.meta.articleId);
      if (!article || article.kind !== kind || data.url !== article.href) {
        throw new Error(
          "The search index does not match the article catalog. Refresh the page.",
        );
      }
      return article;
    }),
  );
  return { ...page, items, order: "relevance" };
}
