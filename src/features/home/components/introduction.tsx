"use client";

import { useLayoutEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Bot, type BotMood } from "@/features/bot/bot";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

export function Introduction({
  compact,
  mood,
  activityKey,
  completed,
  failed,
  arrival,
  exploreKey,
}: {
  compact: boolean;
  mood: BotMood;
  activityKey?: string;
  completed?: boolean;
  failed?: boolean;
  arrival?: { id: number; kind: "arrival" | "return" };
  exploreKey?: string;
}) {
  const section = useRef<HTMLElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    const element = copy.current;
    if (!element || compact) return;
    const resize = () => {
      section.current?.style.setProperty(
        "--bot-size",
        `${element.getBoundingClientRect().height / 1.618}px`,
      );
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [compact]);

  return (
    <section
      ref={section}
      aria-label="Introduction"
      className={cn(
        "flex min-w-0",
        compact
          ? "items-center gap-3 sm:gap-[15px]"
          : "min-h-60 flex-1 flex-col items-start justify-center gap-[18px] pb-10 [--bot-size:84px] sm:min-h-[300px] sm:flex-row sm:items-center sm:gap-[26px] sm:pb-[clamp(32px,9vh,110px)]",
      )}
    >
      <motion.div
        layout={!reducedMotion}
        layoutDependency={compact}
        initial={false}
        transition={{
          layout: {
            type: "tween",
            duration: reducedMotion ? 0 : 0.56,
            ease: [0.22, 1, 0.36, 1],
          },
        }}
        className="relative z-10 shrink-0"
      >
        <Bot
          mood={mood}
          activityKey={activityKey}
          completed={completed}
          failed={failed}
          arrival={arrival}
          exploreKey={exploreKey}
          className={
            compact
              ? "size-[43px] sm:size-[54px]"
              : "size-[clamp(44px,13vw,62px)] sm:size-[var(--bot-size)]"
          }
        />
      </motion.div>
      <div ref={copy} className={cn("min-w-0", !compact && "max-w-[480px]")}>
        {!compact && (
          <p className="mb-1.5 font-mono text-[11.5px] tracking-[0.01em] text-muted-foreground sm:text-[12.5px]">
            <span
              className="mr-2 -mt-0.5 inline-block h-3.5 w-[7px] rounded-[2px] bg-accent align-middle"
              aria-hidden
            />
            Hey, I’m
          </p>
        )}
        {compact ? (
          <p className="text-[19px] leading-tight font-bold tracking-tight sm:text-[21px]">
            {site.name}
          </p>
        ) : (
          <h1 className="text-[clamp(19px,5.5vw,23px)] leading-[1.05] font-bold tracking-[-0.04em] sm:text-[26px]">
            {site.name}
          </h1>
        )}
        {!compact && (
          <>
            <p className="mt-2 font-mono text-[11px] leading-[1.6] text-foreground-soft sm:text-[12.5px]">
              {site.role}
            </p>
            <p className="mt-2.5 max-w-[46ch] text-[13px] leading-[1.6] text-muted-foreground sm:text-sm">
              {site.bio}
            </p>
          </>
        )}
      </div>
    </section>
  );
}
