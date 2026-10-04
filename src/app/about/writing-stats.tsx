import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ArticleSummary } from "@/lib/writing/types";
import { cn } from "@/lib/utils";

const KINDS = [
  { kind: "notes", label: "notes", href: "/notes" },
  { kind: "thoughts", label: "thoughts", href: "/thoughts" },
] as const;

const LABEL = "font-mono text-xs leading-4 text-muted-foreground";
const LINK =
  "group flex min-w-0 flex-col gap-1 rounded-md py-1 text-foreground/80 transition-colors duration-200 hover:text-accent focus-visible:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent motion-reduce:transition-none md:flex-row md:items-baseline md:gap-2 md:py-0.5";

// The total leads one panel; its two categories are directory links.
export function WritingStats({
  articles,
}: {
  articles: readonly Pick<ArticleSummary, "kind">[];
}) {
  return (
    <ul className="grid min-w-0 grid-cols-3 items-end gap-2 rounded-lg border border-border bg-muted/40 p-3 md:grid-cols-1 md:items-stretch md:gap-1 md:px-4">
      <li className="flex min-w-0 flex-col gap-1">
        <span className="text-4xl font-medium leading-10 tabular-nums tracking-[-0.04em] text-foreground">
          {articles.length}
        </span>
        <span className={LABEL}>posts</span>
      </li>
      {KINDS.map(({ kind, label, href }) => (
        <li key={kind} className="min-w-0">
          <Link href={href} className={LINK}>
            <span className="text-base font-medium leading-7 tabular-nums">
              {articles.filter((article) => article.kind === kind).length}
            </span>
            <span
              className={cn(
                LABEL,
                "flex items-center gap-1 whitespace-nowrap group-hover:text-accent group-focus-visible:text-accent md:flex-1 md:gap-2",
              )}
            >
              {label}
              <ArrowRight
                aria-hidden
                strokeWidth={1.5}
                className="size-3 shrink-0 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5 motion-safe:group-focus-visible:translate-x-0.5 motion-safe:group-active:translate-x-0 motion-reduce:transition-none md:ml-auto"
              />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
