"use client";

import { ProjectCard } from "@/components/projects/project-card";
import { ArticleCard } from "@/components/writing/article-card";
import { textLanguage } from "@/lib/utils";
import { resolveReference } from "../catalog";
import type { Message, PublicCatalog } from "../types";

export function AnswerContent({
  message,
  catalog,
}: {
  message: Message;
  catalog: PublicCatalog;
}) {
  const state = message.error
    ? "error"
    : message.complete
      ? "complete"
      : "streaming";
  return (
    <div
      aria-busy={state === "streaming"}
      data-testid="answer"
      data-state={state}
    >
      <p
        lang={textLanguage(message.text)}
        className="max-w-2xl whitespace-pre-line text-sm leading-7 text-foreground/80 sm:text-[15px]"
      >
        <span
          data-testid={state === "streaming" ? "streaming-text" : undefined}
        >
          {message.text}
        </span>
        {state === "streaming" && (
          <span
            aria-hidden
            className="ml-1 inline-block size-1.5 rounded-full bg-accent align-middle"
          />
        )}
      </p>
      {message.answer && message.answer.references.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {message.answer.references.map((reference) => {
            const content = resolveReference(reference, catalog);
            return (
              <div
                key={`${reference.type}:${reference.id}`}
                className="min-w-0 animate-enter"
              >
                {content.type === "project" ? (
                  <ProjectCard project={content.item} />
                ) : (
                  <ArticleCard
                    article={content.item}
                    origin={{ type: "conversation" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
