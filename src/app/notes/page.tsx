import type { Metadata } from "next";
import { PageIntro } from "@/components/site/page-intro";
import { ArticleDirectory } from "@/components/writing/article-directory";
import { getArticleSummaries } from "@/lib/writing/content.server";

export const metadata: Metadata = {
  title: "Notes",
  description: "Notes on Go, RPC, and the questions I’m learning through.",
};

export default function NotesPage() {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-4xl px-[18px] pt-10 pb-20 sm:px-7 sm:pt-16"
    >
      <PageIntro
        title="Notes"
        description="A record of things I’m learning. Mostly backend engineering, with a few questions that lead somewhere else."
      />
      <ArticleDirectory articles={getArticleSummaries("notes")} />
    </main>
  );
}
