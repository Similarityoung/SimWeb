"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHomeConversation } from "./conversation-provider";
import { useAnswerPresentation } from "./use-answer-presentation";
import type { BotMood } from "@/features/bot/bot";
import type { PresentationPhase } from "./answer-presentation";
import { Introduction } from "./components/introduction";
import { TopicShortcuts } from "./components/topic-shortcuts";
import { Transcript } from "./components/transcript";
import { Composer } from "./components/composer";
import type { Question } from "./types";

const phaseMood: Partial<Record<PresentationPhase, BotMood>> = {
  sending: "responding",
  waiting: "responding",
  streaming: "responding",
  cards: "responding",
};

export function HomeExperience() {
  const { messages, pending, submit, clear, catalog, arrival } =
    useHomeConversation();
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");
  const [exploreKey, setExploreKey] = useState<string>();
  const presentation = useAnswerPresentation(messages);
  const active = messages.length > 0;
  const latest = messages.at(-1);
  const answerMood = presentation.frame && phaseMood[presentation.frame.phase];
  const mood =
    (answerMood === "responding" && latest?.answer?.kind === "unmatched"
      ? "unmatched"
      : answerMood) ?? (focused ? "listening" : "idle");

  function ask(question: Question) {
    if (pending) return;
    setDraft("");
    setExploreKey(undefined);
    void submit(question);
  }

  function reset() {
    clear();
    setDraft("");
    setExploreKey(undefined);
  }

  return (
    <main
      id="main-content"
      className={cn(
        "mx-auto flex w-full max-w-4xl flex-col px-[18px] pb-[max(16px,env(safe-area-inset-bottom))] sm:px-7 sm:pb-[max(22px,env(safe-area-inset-bottom))]",
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
          activityKey={presentation.messageId}
          completed={
            presentation.frame?.phase === "complete" &&
            latest?.answer?.kind === "answer"
          }
          failed={presentation.frame?.phase === "error"}
          arrival={arrival}
          exploreKey={exploreKey}
        />
        {active && (
          <Button
            variant="ghost"
            size="icon"
            onClick={reset}
            aria-label="Clear conversation"
            className="h-11 w-auto shrink-0 gap-1.5 px-1.5 font-mono text-[11px] font-normal text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted"
          >
            <RotateCcw className="size-4" strokeWidth={1.5} />
            Clear
          </Button>
        )}
      </div>
      {active && (
        <Transcript
          messages={messages}
          catalog={catalog}
          presentation={presentation}
        />
      )}
      <div className="shrink-0 pt-3">
        <TopicShortcuts
          compact={active}
          disabled={pending}
          onAsk={ask}
          onExplore={(topic) => {
            if (answerMood !== "responding") setExploreKey(topic);
          }}
        />
        <Composer
          pending={pending}
          value={draft}
          onChange={setDraft}
          onSubmit={(text) => ask({ text })}
          onFocusChange={setFocused}
        />
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {latest?.answer?.text}
      </p>
    </main>
  );
}
