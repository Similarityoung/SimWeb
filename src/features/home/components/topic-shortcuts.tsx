import { useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
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
  onHover,
}: {
  compact: boolean;
  disabled: boolean;
  onAsk: (question: Question) => void;
  onHover: (topic?: string) => void;
}) {
  const highlightId = useId();
  const reducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState<string>();
  const [focused, setFocused] = useState<string>();
  const highlighted = disabled ? undefined : (focused ?? hovered);

  return (
    <div
      className={cn(
        "relative isolate grid gap-2.5",
        compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4",
      )}
      aria-label="Conversation topics"
      onPointerLeave={() => {
        setHovered(undefined);
        onHover();
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setFocused(undefined);
      }}
    >
      {topics.map((topic) => {
        const Icon = icons[topic.id];
        return (
          <button
            key={topic.id}
            type="button"
            disabled={disabled}
            data-highlighted={highlighted === topic.id}
            onClick={() => {
              setHovered(undefined);
              setFocused(undefined);
              onAsk({ text: topic.question, topic: topic.id });
            }}
            onPointerEnter={(event) => {
              if (event.pointerType === "touch" || disabled) return;
              setHovered(topic.id);
              onHover(topic.id);
            }}
            onFocus={(event) => {
              setFocused(
                event.currentTarget.matches(":focus-visible")
                  ? topic.id
                  : undefined,
              );
            }}
            className={cn(
              "group relative rounded-xl border text-left transition-colors active:bg-accent/10 disabled:pointer-events-none disabled:opacity-50 data-[highlighted=true]:border-transparent",
              compact
                ? "min-h-11 px-2 text-center sm:px-3"
                : "px-3.5 pt-[13px] pb-[14px] sm:px-4 sm:pt-4 sm:pb-[18px]",
            )}
          >
            {highlighted === topic.id && (
              <motion.span
                layoutId={highlightId}
                initial={false}
                transition={{
                  duration: reducedMotion ? 0 : 0.2,
                  ease: "easeOut",
                }}
                className="pointer-events-none absolute -inset-px -z-10 rounded-xl border border-accent/45 bg-accent/[0.07] dark:bg-accent/10"
                aria-hidden
              />
            )}
            {!compact && (
              <Icon
                className="mb-3 size-5 text-foreground-soft transition-colors group-data-[highlighted=true]:text-accent sm:mb-3.5"
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
                  className="absolute top-[13px] right-[13px] size-[15px] -translate-x-[3px] translate-y-[3px] text-accent opacity-0 transition-[opacity,translate] duration-200 group-data-[highlighted=true]:translate-0 group-data-[highlighted=true]:opacity-100 sm:top-[15px] sm:right-[15px]"
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
