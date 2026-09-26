import "server-only";
import { notFound } from "next/navigation";
import { getArticle, getArticleSummaries } from "@/lib/writing/content.server";
import type { WritingKind } from "@/lib/writing/types";
import { ArticleReader } from "@/components/writing/article-reader";
import { ArticleReturnLink } from "@/app/_home/article-return-link";

type Props = { params: Promise<{ slug: string }> };

export function articleRoute(kind: WritingKind) {
  async function read({ params }: Props) {
    const article = getArticle(kind, (await params).slug);
    if (!article) notFound();
    return article;
  }
  return {
    generateStaticParams: () =>
      getArticleSummaries(kind).map(({ slug }) => ({ slug })),
    async generateMetadata(props: Props) {
      const article = await read(props);
      return {
        title: article.title,
        description: article.summary,
        alternates: { canonical: article.href },
      };
    },
    async Page(props: Props) {
      const article = await read(props);
      return (
        <main id="main-content">
          <ArticleReader
            article={article}
            backLink={<ArticleReturnLink kind={kind} />}
          />
        </main>
      );
    },
  };
}
