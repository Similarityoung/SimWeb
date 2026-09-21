"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ProjectCard } from "@/features/projects/project-card";
import { ArticleCard } from "@/features/writing/article-card";
import { resolveReference } from "../answer-question";
import type { Answer, PublicCatalog } from "../types";
import { createAnswerChunks } from "./answer-chunks";

export function AnswerContent({
  answer,
  catalog,
  stream,
}: {
  answer: Answer;
  catalog: PublicCatalog;
  stream: boolean;
}) {
  const text = useRef<HTMLSpanElement>(null);
  const [finished, setFinished] = useState(false);
  const streaming = stream && !finished;

  useLayoutEffect(() => {
    const element = text.current;
    if (!streaming || !element) return;
    const chunks = createAnswerChunks(answer.text);
    const output = document.createTextNode("");
    element.replaceChildren(output);
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;
    const appendChunk = () => {
      const chunk = chunks[index++];
      if (chunk) output.appendData(chunk.content);
      if (index >= chunks.length) {
        setFinished(true);
      } else {
        timer = setTimeout(appendChunk, chunks[index].delayMs);
      }
    };
    timer = setTimeout(appendChunk, chunks[0]?.delayMs ?? 0);
    return () => clearTimeout(timer);
  }, [answer.text, streaming]);

  return (
    <div
      aria-busy={streaming}
      data-testid="answer"
      data-state={streaming ? "streaming" : "complete"}
    >
      <p className="max-w-2xl text-sm leading-7 text-foreground/80 sm:text-[15px]">
        {streaming ? (
          <>
            <span ref={text} aria-hidden data-testid="streaming-text" />
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
      {!streaming && !!answer.references.length && (
        <div className="mt-5 grid animate-enter gap-3 sm:grid-cols-2">
          {answer.references.map((reference) => {
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
    </div>
  );
}
