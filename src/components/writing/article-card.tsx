import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ArticleSummary } from "@/lib/writing/types";
import { ArticleCardLink } from "./article-card-link";

export function ArticleCard({
  article,
  source,
}: {
  article: ArticleSummary;
  source?: "conversation" | "directory";
}) {
  return (
    <ArticleCardLink
      href={source ? `${article.href}?from=${source}` : article.href}
      articleId={article.id}
      title={article.title}
    >
      <Card className="h-full gap-4 p-5 shadow-none transition-colors group-hover:border-foreground/30 group-hover:bg-muted/50">
        <div className="flex items-center justify-between gap-4 font-mono text-[11px] text-muted-foreground">
          <time dateTime={article.date}>
            {new Date(article.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })}
          </time>
          <ArrowUpRight
            className="size-4 transition-colors group-hover:text-accent"
            strokeWidth={1.5}
            aria-hidden
          />
        </div>
        <h3 className="text-base leading-relaxed font-medium tracking-tight">
          {article.title}
        </h3>
        <p className="text-sm leading-7 text-muted-foreground" lang="zh-CN">
          {article.summary}
        </p>
        {article.tags.length > 0 && (
          <p className="mt-auto font-mono text-[11px] text-muted-foreground">
            {article.tags.slice(0, 3).join(" / ")}
          </p>
        )}
      </Card>
    </ArticleCardLink>
  );
}
