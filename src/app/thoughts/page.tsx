import { PageShell } from "@/components/site/page-shell";
import type { Metadata } from "next";
import { ArticleDirectory } from "@/components/writing/article-directory";
import { getArticleSummaries } from "@/lib/writing/content.server";

export const metadata: Metadata = {
  title: "Thoughts",
  description: "Thoughts on building, learning, and working through problems.",
};

export default function ThoughtsPage() {
  return (
    <PageShell
      title="Thoughts"
      description="A little space to think beyond the implementation. How I approach problems, learn, and make sense of the work."
    >
      <ArticleDirectory articles={getArticleSummaries("thoughts")} />
    </PageShell>
  );
}
