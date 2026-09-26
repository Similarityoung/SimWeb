import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticle, getArticleSummaries } from "@/lib/writing/content.server";
import { ArticleReader } from "@/components/writing/article-reader";
import { ArticleReturnLink } from "@/app/_home/article-return-link";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return getArticleSummaries("thoughts").map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticle("thoughts", (await params).slug);
  if (!article) notFound();
  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: article.href },
  };
}
export default async function ThoughtPage({ params }: Props) {
  const article = getArticle("thoughts", (await params).slug);
  if (!article) notFound();
  return (
    <main id="main-content">
      <ArticleReader
        article={article}
        backLink={<ArticleReturnLink kind={article.kind} />}
      />
    </main>
  );
}
