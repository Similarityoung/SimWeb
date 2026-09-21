import {
  ArrowUpRight,
  Feather,
  Folder,
  NotebookPen,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { topics } from "../presets";
import type { Question } from "../types";

const icons = {
  projects: Folder,
  notes: NotebookPen,
  thoughts: Feather,
  about: UserRound,
};

export function TopicShortcuts({
  compact,
  disabled,
  onAsk,
}: {
  compact: boolean;
  disabled: boolean;
  onAsk: (question: Question) => void;
}) {
  return (
    <div
      className={cn(
        "relative isolate grid gap-2.5",
        compact
          ? "grid-cols-4"
          : [
              "grid-cols-2 sm:grid-cols-4 [--topic-index:0]",
              "before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:-z-10 before:hidden before:w-[calc((100%_-_30px)/4)] before:rounded-xl before:bg-muted before:opacity-0 before:content-[''] sm:before:block",
              "before:translate-x-[calc(var(--focus-index,var(--topic-index))_*_(100%_+_10px))] before:transition-[translate,opacity] before:duration-200 before:ease-out",
              "sm:has-[>button:hover:not(:disabled)]:before:opacity-100 sm:has-[>button:focus-visible]:before:opacity-100",
              "has-[>button:nth-child(1):focus-visible]:[--focus-index:0]",
              "has-[>button:nth-child(2):hover:not(:disabled)]:[--topic-index:1] has-[>button:nth-child(2):focus-visible]:[--focus-index:1]",
              "has-[>button:nth-child(3):hover:not(:disabled)]:[--topic-index:2] has-[>button:nth-child(3):focus-visible]:[--focus-index:2]",
              "has-[>button:nth-child(4):hover:not(:disabled)]:[--topic-index:3] has-[>button:nth-child(4):focus-visible]:[--focus-index:3]",
            ],
      )}
      aria-label="Conversation topics"
    >
      {topics.map((topic) => {
        const Icon = icons[topic.id];
        return (
          <button
            key={topic.id}
            type="button"
            disabled={disabled}
            onClick={() => onAsk({ text: topic.question, topic: topic.id })}
            className={cn(
              "group relative rounded-xl border text-left transition-colors hover:border-border-strong hover:bg-muted active:bg-muted disabled:pointer-events-none disabled:opacity-50",
              compact
                ? "min-h-11 px-2 text-center sm:px-3"
                : "px-3.5 pt-[13px] pb-[14px] sm:px-4 sm:pt-4 sm:pb-[18px] sm:hover:bg-transparent",
            )}
          >
            {!compact && (
              <Icon
                className="mb-3 size-5 text-foreground-soft sm:mb-3.5"
                strokeWidth={1.5}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "block font-medium",
                compact ? "text-[11px] sm:text-xs" : "text-sm",
              )}
            >
              {topic.label}
            </span>
            {!compact && (
              <>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {topic.description}
                </span>
                <ArrowUpRight
                  className="absolute top-[13px] right-[13px] size-[15px] -translate-x-[3px] translate-y-[3px] text-accent opacity-0 transition-[opacity,translate] duration-200 group-hover:translate-0 group-hover:opacity-100 group-focus-visible:translate-0 group-focus-visible:opacity-100 sm:top-[15px] sm:right-[15px]"
                  aria-hidden
                />
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
