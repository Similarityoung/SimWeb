"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, textLanguage } from "@/lib/utils";
import { useHomeConversation } from "./conversation-provider";
import type { BotMood } from "@/components/bot/bot";
import { Introduction } from "./components/introduction";
import { TopicShortcuts } from "./components/topic-shortcuts";
import { Transcript } from "./components/transcript";
import { Composer } from "./components/composer";
import type { Question } from "./types";

export function HomeExperience() {
  const {
    messages,
    pending,
    submit,
    clear,
    catalog,
    arrival,
    scrollPositionRef,
  } = useHomeConversation();
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const [hoveredTopic, setHoveredTopic] = useState<string>();
  const [settledOnMount] = useState(
    () =>
      new Set(messages.filter((m) => m.complete || m.error).map((m) => m.id)),
  );
  const active = messages.length > 0;
  const latest = messages.at(-1);
  const freshResult = latest && !settledOnMount.has(latest.id);
  const answerInProgress = pending;
  const answerMood: BotMood | undefined = pending
    ? "responding"
    : freshResult &&
        latest?.answer?.kind === "unmatched" &&
        !focused &&
        !hoveredTopic
      ? "unmatched"
      : undefined;
  const mood: BotMood =
    answerMood ?? (focused || hoveredTopic ? "listening" : "idle");

  function ask(question: Question) {
    if (answerInProgress) return;
    setDraft("");
    setHoveredTopic(undefined);
    if (question.type === "topic") setFocused(false);
    void submit(question);
  }

  function reset() {
    clear();
    scrollPositionRef.current = { top: 0 };
    setDraft("");
    setHoveredTopic(undefined);
  }

  return (
    <main
      id="main-content"
      className={cn(
        "site-container flex flex-col pb-[max(16px,env(safe-area-inset-bottom))] sm:pb-[max(22px,env(safe-area-inset-bottom))]",
        active
          ? "h-[calc(100dvh-4.75rem)] min-h-96"
          : "min-h-[max(584px,calc(100svh-4.75rem))] sm:min-h-[max(564px,calc(100svh-4.75rem))]",
      )}
    >
      <div
        className={cn(
          active
            ? "flex shrink-0 items-center justify-between gap-3 border-b pb-4"
            : "flex flex-1",
        )}
      >
        <Introduction
          compact={active}
          mood={mood}
          activityKey={latest?.id}
          completed={Boolean(
            freshResult && latest?.complete && latest.answer?.kind === "answer",
          )}
          failed={Boolean(freshResult && latest?.error)}
          arrival={arrival}
        />
        {active && (
          <Button
            variant="ghost"
            size="icon"
            onClick={reset}
            aria-label="Clear conversation"
            title="Clear conversation"
            className="size-11"
          >
            <RotateCcw className="size-4" strokeWidth={1.5} aria-hidden />
          </Button>
        )}
      </div>
      {active && (
        <Transcript
          messages={messages}
          catalog={catalog}
          scrollPositionRef={scrollPositionRef}
        />
      )}
      <div
        className="shrink-0 pt-3"
        onFocus={(event) => {
          // Card activation is consumed by ask; drafting may continue during an answer.
          setFocused(
            event.target.tagName === "INPUT" || answerMood !== "responding",
          );
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setFocused(false);
        }}
      >
        <TopicShortcuts
          compact={active}
          disabled={answerInProgress}
          onAsk={ask}
          onHover={(topic) => {
            if (answerMood !== "responding") setHoveredTopic(topic);
          }}
        />
        <Composer
          submitDisabled={answerInProgress}
          value={draft}
          onChange={setDraft}
          onSubmit={(text) => ask({ type: "text", text })}
        />
      </div>
      <p
        className="sr-only"
        role="status"
        aria-live="polite"
        lang={textLanguage(pending ? "" : latest?.answer?.text)}
      >
        {pending ? "One moment…" : latest?.complete ? latest.answer?.text : ""}
      </p>
    </main>
  );
}
