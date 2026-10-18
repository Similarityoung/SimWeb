import "server-only";
import Link from "next/link";
import {
  Children,
  isValidElement,
  ViewTransition,
  type ReactNode,
} from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import { renderMermaid } from "@/lib/writing/mermaid";
import { remarkWikiLinks } from "@/lib/writing/wiki-links";
import type { ArticlePage } from "@/lib/writing/types";
import { BackLink } from "@/components/ui/back-link";
import styles from "./article-reader.module.css";

type CodeElementProps = { className?: string; children?: ReactNode };

function textContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textContent).join("");
  if (isValidElement<{ children?: ReactNode }>(node))
    return textContent(node.props.children);
  return "";
}

function mermaidSource(children: ReactNode): string | undefined {
  const [code] = Children.toArray(children);
  if (!isValidElement<CodeElementProps>(code)) return undefined;
  if (!code.props.className?.split(/\s+/).includes("language-mermaid"))
    return undefined;
  return textContent(code.props.children);
}

export function ArticleReader({
  article,
  backLink,
}: {
  article: ArticlePage;
  backLink: ReactNode;
}) {
  let diagramIndex = 0;

  return (
    <article
      className={`${styles.article} mx-auto max-w-3xl px-6 pt-6 pb-24`}
      lang="zh-CN"
    >
      {backLink}
      <ViewTransition
        name={`article-${article.id}`}
        share="article-opening"
        enter="article-enter"
        default="none"
      >
        <header className="mt-5 mb-12 border-b pb-9">
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
      </ViewTransition>
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
            pre: ({ children, node, ...props }) => {
              void node;
              const source = mermaidSource(children);
              if (source === undefined) return <pre {...props}>{children}</pre>;

              const result = renderMermaid(
                source,
                `${article.id}-mermaid-${++diagramIndex}`,
              );
              if (!result.ok)
                return (
                  <div className={styles.mermaidError} role="alert">
                    <strong>Mermaid 图表渲染失败</strong>
                    <p>{result.error}</p>
                    <pre>
                      <code>{source}</code>
                    </pre>
                  </div>
                );

              return (
                <div
                  className={styles.mermaid}
                  dangerouslySetInnerHTML={{ __html: result.svg }}
                />
              );
            },
            img: ({ node, ...props }) => {
              void node;
              return (
                // eslint-disable-next-line @next/next/no-img-element -- Remote Markdown images retain their natural size.
                <img
                  {...props}
                  alt={props.alt}
                  loading="lazy"
                  decoding="async"
                />
              );
            },
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
      <footer className="mt-16 border-t pt-6">
        <BackLink href={`/${article.kind}`} label={`All ${article.kind}`} />
      </footer>
    </article>
  );
}
