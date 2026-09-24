export type WritingKind = "notes" | "thoughts";

export type ArticleSummary = {
  id: string;
  kind: WritingKind;
  slug: string;
  title: string;
  summary: string;
  date: string;
  tags: readonly string[];
  href: string;
};

export type Article = ArticleSummary & { body: string };
