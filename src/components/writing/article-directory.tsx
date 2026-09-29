import type { DirectoryPage } from "@/lib/writing/directory";
import { articleAnchor, articleHref } from "@/lib/writing/reading-location";
import type { ArticleSummary, WritingKind } from "@/lib/writing/types";
import { ArticleCard } from "./article-card";
import { ArticleCardLink } from "./article-card-link";

export function ArticleDirectory({
  kind,
  page,
}: {
  kind: WritingKind;
  page: DirectoryPage;
}) {
  return (
    <section aria-label="All articles">
      {page.items.length === 0 ? (
        <div
          className={
            kind === "notes"
              ? "rounded-xl border border-dashed px-6 py-14"
              : "py-8"
          }
          lang="en"
        >
          <h2 className="text-base font-medium">No articles found</h2>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {page.query.q || page.query.category || page.query.tag
              ? "Try a different search or clear a filter."
              : "There are no published articles here yet."}
          </p>
        </div>
      ) : kind === "notes" ? (
        <div className="grid gap-3.5">
          {page.items.map((article) => (
            <div
              key={article.id}
              id={articleAnchor(article.id)}
              tabIndex={-1}
              className="scroll-mt-24 rounded-xl"
            >
              <ArticleCard
                article={article}
                layout="directory"
                origin={{ type: "directory", query: page.query }}
              />
            </div>
          ))}
        </div>
      ) : (
        <ol aria-label="Thoughts timeline" className="max-w-[680px]">
          {Array.from(groupByMonth(page.items), ([month, articles]) => (
            <li
              key={month}
              className="relative pb-9 before:absolute before:top-4 before:-bottom-4 before:left-1 before:w-px before:bg-border last:pb-0 last:before:hidden sm:pb-10"
            >
              <section
                aria-labelledby={`thoughts-month-${month}`}
                className="pl-7 sm:pl-8"
              >
                <span
                  aria-hidden
                  className="absolute top-[13px] left-px size-1.5 rounded-full bg-accent ring-4 ring-background"
                />
                <h2
                  id={`thoughts-month-${month}`}
                  className="mb-3 text-2xl leading-[30px] font-medium tracking-[-0.6px] text-foreground sm:mb-3.5 sm:text-[26px] sm:leading-8"
                  lang="en"
                >
                  <time dateTime={month} className="flex items-baseline gap-3">
                    <span>
                      {new Date(articles[0].date).toLocaleDateString("en-US", {
                        month: "long",
                        timeZone: "UTC",
                      })}
                    </span>{" "}
                    <span className="font-mono text-xs leading-5 font-normal tracking-normal text-muted-foreground">
                      {month.slice(0, 4)}
                    </span>
                  </time>
                </h2>
                <ArchiveEntries articles={articles} page={page} />
              </section>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function ArticleDirectorySkeleton() {
  return (
    <div aria-hidden className="space-y-3.5">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="rounded-xl border p-5 motion-safe:animate-pulse sm:px-6"
        >
          <div className="h-7 w-1/2 rounded bg-muted" />
          <div className="mt-2 h-7 w-full rounded bg-muted" />
          <div className="mt-4 flex justify-between">
            <div className="h-5 w-16 rounded bg-muted" />
            <div className="h-5 w-24 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function groupByMonth(articles: readonly ArticleSummary[]) {
  const groups = new Map<string, ArticleSummary[]>();
  for (const article of articles) {
    const month = article.date.slice(0, 7);
    const group = groups.get(month) ?? [];
    group.push(article);
    groups.set(month, group);
  }
  return groups;
}

function ArchiveEntries({
  articles,
  page,
}: {
  articles: readonly ArticleSummary[];
  page: DirectoryPage;
}) {
  return (
    <div className="min-w-0 space-y-8 sm:space-y-10">
      {articles.map((article) => (
        <div
          key={article.id}
          id={articleAnchor(article.id)}
          tabIndex={-1}
          className="scroll-mt-24 rounded-xl"
        >
          <ArticleCardLink
            href={articleHref(article, {
              type: "directory",
              query: page.query,
            })}
            articleId={article.id}
            title={article.title}
          >
            <div className="max-w-xl [overflow-wrap:anywhere]">
              <h3
                className="text-base leading-[26px] font-normal text-foreground-soft transition-colors group-hover:text-accent group-focus-visible:text-accent"
                lang="zh-CN"
              >
                {article.title}
              </h3>
              <p
                className="mt-1 text-sm leading-6 text-pretty text-muted-foreground"
                lang="zh-CN"
              >
                {article.summary}
              </p>
            </div>
          </ArticleCardLink>
        </div>
      ))}
    </div>
  );
}
