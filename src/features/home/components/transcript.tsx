"use client";

import { useEffect, useRef } from "react";
import { ProjectCard } from "@/features/projects/project-card";
import { ArticleCard } from "@/features/writing/article-card";
import { resolveReference } from "../answer-question";
import type { Message, PublicCatalog } from "../types";

export function Transcript({
  messages,
  catalog,
}: {
  messages: readonly Message[];
  catalog: PublicCatalog;
}) {
  const scrollArea = useRef<HTMLDivElement>(null);
  const latestExchange = useRef<HTMLElement>(null);
  useEffect(() => {
    scrollArea.current?.scrollTo({
      top: latestExchange.current?.offsetTop ?? 0,
      behavior: "instant",
    });
  }, [messages]);
  return (
    <section
      ref={scrollArea}
      aria-label="Conversation"
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-6 pr-1 [scrollbar-width:thin] sm:py-8"
    >
      <div className="relative space-y-9">
        {messages.map((message, index) => (
          <article
            key={message.id}
            ref={index === messages.length - 1 ? latestExchange : undefined}
            className="min-w-0 animate-enter [overflow-wrap:anywhere]"
            data-testid="exchange"
          >
            <p className="mb-6 ml-auto w-fit max-w-[85%] rounded-[16px] rounded-br-[4px] bg-muted px-[18px] py-3 text-sm leading-6">
              {message.question}
            </p>
            <div aria-busy={!message.answer && !message.error}>
              {message.answer ? (
                <>
                  <p className="max-w-2xl text-sm leading-7 text-foreground/80 sm:text-[15px]">
                    {message.answer.text}
                  </p>
                  {!!message.answer.references.length && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {message.answer.references.map((reference) => {
                        const content = resolveReference(reference, catalog);
                        return content.type === "project" ? (
                          <ProjectCard
                            key={`project:${content.item.id}`}
                            project={content.item}
                          />
                        ) : (
                          <ArticleCard
                            key={`article:${content.item.id}`}
                            article={content.item}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              ) : message.error ? (
                <p role="alert" className="text-sm text-accent">
                  {message.error}
                </p>
              ) : (
                <p
                  role="status"
                  className="font-mono text-xs text-muted-foreground"
                >
                  One moment…
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
