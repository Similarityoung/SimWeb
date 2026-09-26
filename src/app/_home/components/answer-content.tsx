"use client";

import { ProjectCard } from "@/components/projects/project-card";
import { ArticleCard } from "@/components/writing/article-card";
import { resolveReference } from "../answer-question";
import type { Answer, PublicCatalog } from "../types";
import type { AnswerPresentation } from "../answer-presentation";

export function AnswerContent({
  answer,
  catalog,
  presentation,
}: {
  answer: Answer;
  catalog: PublicCatalog;
  presentation?: AnswerPresentation;
}) {
  const phase = presentation?.phase ?? "complete";
  const streaming =
    phase === "sending" || phase === "waiting" || phase === "streaming";
  const complete = phase === "complete";
  const visibleCards = presentation?.visibleCards ?? answer.references.length;

  return (
    <div
      aria-busy={!complete}
      data-testid="answer"
      data-state={complete ? "complete" : phase}
      data-phase={phase}
    >
      <p className="max-w-2xl text-sm leading-7 text-foreground/80 sm:text-[15px]">
        {streaming ? (
          <>
            <span aria-hidden data-testid="streaming-text">
              {answer.text.slice(0, presentation?.textLength ?? 0)}
            </span>
            <span
              aria-hidden
              className="ml-1 inline-block size-1.5 rounded-full bg-accent align-middle"
            />
            <span className="sr-only">{answer.text}</span>
          </>
        ) : (
          answer.text
        )}
      </p>
      {visibleCards > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {answer.references.slice(0, visibleCards).map((reference) => {
            const content = resolveReference(reference, catalog);
            return (
              <div
                key={`${reference.type}:${reference.id}`}
                className="min-w-0 animate-enter"
              >
                {content.type === "project" ? (
                  <ProjectCard project={content.item} />
                ) : (
                  <ArticleCard article={content.item} source="conversation" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
