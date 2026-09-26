export type WritingKind = "notes" | "thoughts";

export type ArticleSummary = {
  id: string;
  kind: WritingKind;
  slug: string;
  title: string;
  summary: string;
  date: string;
  categories: readonly string[];
  tags: readonly string[];
  href: string;
};

export type Article = ArticleSummary & { body: string };

export type ArticlePage = Article & {
  wikiLinkTargets: Readonly<Record<string, string>>;
};
