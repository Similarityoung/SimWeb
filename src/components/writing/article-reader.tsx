import "server-only";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { remarkWikiLinks } from "@/lib/writing/wiki-links";
import type { ArticlePage } from "@/lib/writing/types";

export function ArticleReader({ article }: { article: ArticlePage }) {
  return (
    <article
      className="mx-auto max-w-3xl px-6 pt-8 pb-24 sm:pt-14"
      lang="zh-CN"
    >
      <Link
        href={`/${article.kind}`}
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {article.kind === "notes" ? "All notes" : "All thoughts"}
      </Link>
      <header className="mt-7 mb-12 border-b pb-9">
        <time
          dateTime={article.date}
          className="font-mono text-xs text-muted-foreground"
        >
          {article.date.slice(0, 10)}
        </time>
        <h1 className="mt-4 text-3xl leading-snug font-semibold tracking-tight sm:text-4xl">
          {article.title}
        </h1>
        <p className="mt-5 text-base leading-8 text-muted-foreground">
          {article.summary}
        </p>
      </header>
      <div className="prose prose-neutral max-w-none text-foreground dark:prose-invert prose-headings:scroll-mt-8 prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground prose-p:leading-8 prose-a:text-accent prose-a:decoration-border hover:prose-a:decoration-accent prose-blockquote:border-accent/40 prose-blockquote:font-normal prose-blockquote:text-muted-foreground prose-strong:text-foreground prose-code:rounded-sm prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:font-normal prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:bg-muted/60 prose-pre:text-foreground prose-pre:shadow-none prose-pre:[&_code]:bg-transparent prose-pre:[&_code]:p-0 prose-li:leading-8 prose-th:text-foreground prose-img:rounded-lg">
        <Markdown
          remarkPlugins={[
            remarkGfm,
            [remarkWikiLinks, article.wikiLinkTargets],
          ]}
          rehypePlugins={[
            [rehypeHighlight, { ignoreMissing: true }],
            rehypeSlug,
          ]}
          components={{
            h1: ({ children, node, ...props }) => {
              void node;
              return <h2 {...props}>{children}</h2>;
            },
            table: ({ children, node, ...props }) => {
              void node;
              return (
                <div className="overflow-x-auto">
                  <table {...props}>{children}</table>
                </div>
              );
            },
            a: ({ href, children, node, ...props }) => {
              void node;
              return href?.startsWith("/") ? (
                <Link href={href} {...props}>
                  {children}
                </Link>
              ) : (
                <a
                  href={href}
                  {...props}
                  {...(href?.startsWith("http")
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  {children}
                </a>
              );
            },
          }}
        >
          {article.body}
        </Markdown>
      </div>
      <footer className="mt-16 flex flex-wrap justify-between gap-4 border-t pt-6 text-sm text-muted-foreground">
        <Link
          href={`/${article.kind}`}
          className="inline-flex min-h-11 items-center gap-2 hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to {article.kind}
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 hover:text-foreground"
        >
          Back to conversation<span aria-hidden>↗</span>
        </Link>
      </footer>
    </article>
  );
}
