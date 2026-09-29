"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { AnswerContent } from "./answer-content";
import type { Message, PublicCatalog } from "../types";

export function Transcript({
  messages,
  catalog,
  scrollPositionRef,
}: {
  messages: readonly Message[];
  catalog: PublicCatalog;
  scrollPositionRef: RefObject<{ messageId?: string; top: number }>;
}) {
  const scrollArea = useRef<HTMLDivElement>(null);
  const latestExchange = useRef<HTMLElement>(null);
  const previousMessageId = useRef<string | null>(null);
  const followOutput = useRef(true);
  useLayoutEffect(() => {
    const area = scrollArea.current;
    if (!area) return;
    const messageId = messages.at(-1)?.id;
    if (
      previousMessageId.current === null &&
      scrollPositionRef.current.messageId === messageId
    ) {
      area.scrollTop = scrollPositionRef.current.top;
      followOutput.current =
        area.scrollHeight - area.clientHeight - area.scrollTop < 48;
    } else if (previousMessageId.current !== messageId) {
      area.scrollTop = latestExchange.current?.offsetTop ?? 0;
      followOutput.current = true;
    } else if (followOutput.current) {
      area.scrollTop = area.scrollHeight;
    }
    scrollPositionRef.current = { messageId, top: area.scrollTop };
    previousMessageId.current = messageId ?? null;
  }, [messages, scrollPositionRef]);
  return (
    <section
      ref={scrollArea}
      onScroll={(event) => {
        const area = event.currentTarget;
        followOutput.current =
          area.scrollHeight - area.clientHeight - area.scrollTop < 48;
        scrollPositionRef.current.top = area.scrollTop;
      }}
      aria-label="Conversation"
      tabIndex={0}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-6 [scrollbar-width:none] focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-border-strong sm:py-8"
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
            {message.text && (
              <AnswerContent message={message} catalog={catalog} />
            )}
            {message.error ? (
              <p role="alert" className="mt-3 text-sm text-accent">
                {message.error}
              </p>
            ) : !message.text ? (
              <p className="font-mono text-xs text-muted-foreground">
                One moment…
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
