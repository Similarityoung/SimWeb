import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ArticleSummary } from "@/lib/writing/types";
import { ArticleCardLink } from "./article-card-link";
import {
  articleHref,
  type ReadingOrigin,
} from "@/lib/writing/reading-location";
import { cn } from "@/lib/utils";

export function ArticleCard({
  article,
  origin,
  layout = "compact",
}: {
  article: ArticleSummary;
  origin?: ReadingOrigin;
  layout?: "compact" | "directory";
}) {
  const tags = [...new Set(article.tags)];
  const date = (
    <time
      dateTime={article.date}
      lang="en"
      className="shrink-0 whitespace-nowrap font-mono text-[11px] text-muted-foreground"
    >
      {new Date(article.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      })}
    </time>
  );
  return (
    <ArticleCardLink
      href={articleHref(article, origin)}
      articleId={article.id}
      title={article.title}
    >
      <Card
        className={cn(
          "h-full p-5 shadow-none transition-colors group-hover:border-foreground/30 group-hover:bg-muted/50",
          layout === "directory" ? "gap-0 sm:px-6" : "gap-4",
        )}
      >
        {layout === "compact" && (
          <div className="flex items-center justify-between gap-4 text-muted-foreground">
            {date}
            <ArrowUpRight
              className="size-4 transition-colors group-hover:text-accent"
              strokeWidth={1.5}
              aria-hidden
            />
          </div>
        )}
        <h3
          lang="zh-CN"
          className={cn(
            "leading-relaxed font-medium tracking-tight transition-colors group-hover:text-accent",
            layout === "directory" ? "text-lg" : "text-base",
          )}
        >
          {article.title}
        </h3>
        <p
          className={cn(
            "text-sm leading-7 text-muted-foreground",
            layout === "directory" && "mt-1.5 line-clamp-2",
          )}
          lang="zh-CN"
        >
          {article.summary}
        </p>
        {layout === "directory" ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 text-[11px] text-muted-foreground">
            <div className="flex flex-wrap items-center gap-1.5" lang="zh-CN">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded bg-muted px-1.5 py-0.5">
                  {tag}
                </span>
              ))}
              {tags.length > 3 && <span>+{tags.length - 3}</span>}
            </div>
            {date}
          </div>
        ) : tags.length > 0 ? (
          <p className="mt-auto font-mono text-[11px] text-muted-foreground">
            {tags.slice(0, 3).join(" / ")}
            {tags.length > 3 && ` +${tags.length - 3}`}
          </p>
        ) : null}
      </Card>
    </ArticleCardLink>
  );
}
