import "server-only";
import { Suspense } from "react";
import { ArticleDirectory } from "@/components/writing/article-directory";
import {
  DirectoryFilters,
  DirectoryFrame,
  DirectoryPagination,
  DirectorySearch,
} from "@/components/writing/directory-controls";
import { getArticleSummaries } from "@/lib/writing/content.server";
import { browseDirectory, directoryFacets } from "@/lib/writing/directory";
import type { WritingKind } from "@/lib/writing/types";
import { DirectoryClient } from "./directory.client";

export function WritingDirectory({ kind }: { kind: WritingKind }) {
  const articles = getArticleSummaries(kind);
  const initial = browseDirectory(articles, kind, { q: "", page: 1 });
  return (
    <Suspense
      fallback={
        <DirectoryFrame
          kind={kind}
          search={<DirectorySearch kind={kind} value="" disabled />}
          filters={
            <DirectoryFilters
              kind={kind}
              query={initial.query}
              facets={directoryFacets(articles, kind)}
              total={articles.length}
            />
          }
        >
          {kind === "notes" && (
            <p
              className="mb-4 min-h-5 text-xs text-muted-foreground"
              role="status"
            >
              Loading filters…
            </p>
          )}
          <ArticleDirectory kind={kind} page={initial} />
          <DirectoryPagination kind={kind} page={initial} />
        </DirectoryFrame>
      }
    >
      <DirectoryClient kind={kind} articles={articles} />
    </Suspense>
  );
}
