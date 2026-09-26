import { PageShell } from "@/components/site/page-shell";
import type { Metadata } from "next";
import { ArticleDirectory } from "@/components/writing/article-directory";
import { getArticleSummaries } from "@/lib/writing/content.server";

export const metadata: Metadata = {
  title: "Notes",
  description: "Notes on Go, RPC, and the questions I’m learning through.",
};

export default function NotesPage() {
  return (
    <PageShell
      title="Notes"
      description="A record of things I’m learning. Mostly backend engineering, with a few questions that lead somewhere else."
    >
      <ArticleDirectory articles={getArticleSummaries("notes")} />
    </PageShell>
  );
}
