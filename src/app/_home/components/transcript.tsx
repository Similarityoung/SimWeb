"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { textLanguage } from "@/lib/utils";
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
  const fadeTop = useRef<HTMLDivElement>(null);
  const fadeBottom = useRef<HTMLDivElement>(null);
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
    syncScrollFade(area, fadeTop.current, fadeBottom.current);
  }, [messages, scrollPositionRef]);
  useEffect(() => {
    const area = scrollArea.current;
    if (!area) return;
    const update = () =>
      syncScrollFade(area, fadeTop.current, fadeBottom.current);
    const observer = new ResizeObserver(update);
    observer.observe(area);
    const content = area.firstElementChild;
    if (content) observer.observe(content);
    update();
    return () => observer.disconnect();
  }, []);
  return (
    <div className="relative min-h-0 flex-1">
      <section
        ref={scrollArea}
        onScroll={(event) => {
          const area = event.currentTarget;
          followOutput.current =
            area.scrollHeight - area.clientHeight - area.scrollTop < 48;
          scrollPositionRef.current.top = area.scrollTop;
          syncScrollFade(area, fadeTop.current, fadeBottom.current);
        }}
        aria-label="Conversation"
        tabIndex={0}
        className="h-full min-h-0 overflow-y-auto overscroll-contain py-6 [scrollbar-width:none] sm:py-8"
      >
        <div className="relative space-y-9">
          {messages.map((message, index) => (
            <article
              key={message.id}
              ref={index === messages.length - 1 ? latestExchange : undefined}
              className="min-w-0 animate-enter [overflow-wrap:anywhere]"
              data-testid="exchange"
            >
              <h2
                lang={textLanguage(message.question)}
                className="mb-6 ml-auto w-fit max-w-[85%] rounded-bubble rounded-br-sm bg-muted px-[18px] py-3 text-body"
              >
                {message.question}
              </h2>
              {message.text && (
                <AnswerContent message={message} catalog={catalog} />
              )}
              {message.error ? (
                <p role="alert" className="mt-3 text-body text-accent">
                  {message.error}
                </p>
              ) : !message.text ? (
                <p
                  data-testid="waiting-indicator"
                  aria-hidden
                  className="flex items-center gap-2 font-mono text-code text-muted-foreground"
                >
                  <span>One moment</span>
                  <span className="waiting-dots">
                    <span className="waiting-dot" />
                    <span className="waiting-dot" />
                    <span className="waiting-dot" />
                  </span>
                </p>
              ) : null}
            </article>
          ))}
        </div>
      </section>
      <div
        ref={fadeTop}
        aria-hidden
        data-testid="scroll-fade-top"
        data-visible="false"
        className="scroll-fade scroll-fade-top"
      />
      <div
        ref={fadeBottom}
        aria-hidden
        data-testid="scroll-fade-bottom"
        data-visible="false"
        className="scroll-fade scroll-fade-bottom"
      />
    </div>
  );
}

function syncScrollFade(
  area: HTMLElement,
  top: HTMLElement | null,
  bottom: HTMLElement | null,
) {
  const maxScroll = area.scrollHeight - area.clientHeight;
  const atTop = area.scrollTop <= 1;
  const atBottom = area.scrollTop >= maxScroll - 1;
  if (top) top.dataset.visible = String(maxScroll > 1 && !atTop);
  if (bottom) bottom.dataset.visible = String(maxScroll > 1 && !atBottom);
}
