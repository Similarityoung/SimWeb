import { ArticleCard } from "./article-card";
import type { ArticleSummary } from "@/lib/writing/types";

export function ArticleDirectory({
  articles,
}: {
  articles: readonly ArticleSummary[];
}) {
  if (!articles.length)
    return (
      <p className="py-12 text-muted-foreground">
        There’s nothing here yet. Come back soon.
      </p>
    );
  return (
    <section aria-label="All articles" className="grid gap-4 sm:grid-cols-2">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </section>
  );
}
