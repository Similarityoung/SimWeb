"use client";

import { useEffect, useRef } from "react";
import { AnswerContent } from "./answer-content";
import type { Message, PublicCatalog } from "../types";
import type { AnswerPresentation } from "../answer-presentation";

export function Transcript({
  messages,
  catalog,
  presentation,
}: {
  messages: readonly Message[];
  catalog: PublicCatalog;
  presentation: { messageId?: string; frame?: AnswerPresentation };
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
            {message.answer ? (
              <AnswerContent
                answer={message.answer}
                catalog={catalog}
                presentation={
                  message.id === presentation.messageId
                    ? presentation.frame
                    : undefined
                }
              />
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
          </article>
        ))}
      </div>
    </section>
  );
}
