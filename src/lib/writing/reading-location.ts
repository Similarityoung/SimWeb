import {
  directoryHref,
  readDirectoryQuery,
  type DirectoryQuery,
} from "./directory";
import type { ArticleSummary, WritingKind } from "./types";

export type ReadingOrigin =
  { type: "conversation" } | { type: "directory"; query: DirectoryQuery };

export function articleHref(
  article: Pick<ArticleSummary, "kind" | "href">,
  origin?: ReadingOrigin,
): string {
  if (!origin) return article.href;
  const params = new URLSearchParams({ from: origin.type });
  if (origin.type === "directory") {
    const search = directoryHref(article.kind, origin.query).split("?")[1];
    for (const [key, value] of new URLSearchParams(search))
      params.set(key, value);
  }
  return `${article.href}?${params.toString()}`;
}

export function articleAnchor(id: string): string {
  return `article-${id}`;
}

export function articleReturnTarget({
  kind,
  articleId,
  params,
  hasConversation,
}: {
  kind: WritingKind;
  articleId: string;
  params: Pick<URLSearchParams, "get">;
  hasConversation: boolean;
}): { href: string; label: string } {
  const source = params.get("from");
  if (source === "conversation" && hasConversation)
    return { href: "/", label: "Back to conversation" };
  if (source === "directory") {
    const href = directoryHref(kind, readDirectoryQuery(kind, params));
    return {
      href: `${href}#${encodeURIComponent(articleAnchor(articleId))}`,
      label: `Back to ${kind === "notes" ? "Notes" : "Thoughts"}`,
    };
  }
  return { href: `/${kind}`, label: `All ${kind}` };
}
