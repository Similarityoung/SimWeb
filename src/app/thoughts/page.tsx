import type { Metadata } from "next";
import { PageIntro } from "@/components/site/page-intro";
import { ArticleDirectory } from "@/features/writing/article-directory";
import { getArticleSummaries } from "@/features/writing/content.server";

export const metadata: Metadata = {
  title: "Thoughts",
  description: "Thoughts on building, learning, and working through problems.",
};

export default function ThoughtsPage() {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-4xl px-[18px] pt-10 pb-20 sm:px-7 sm:pt-16"
    >
      <PageIntro
        title="Thoughts"
        description="A little space to think beyond the implementation. How I approach problems, learn, and make sense of the work."
      />
      <ArticleDirectory articles={getArticleSummaries("thoughts")} />
    </main>
  );
}
