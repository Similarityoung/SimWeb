"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { selectBehavior, type BotMood, type CharacterState } from "./behavior";
import { loadRuntime, type BotRuntime } from "./runtime.client";

// Internal renderer shared by the public Bot and the development preview.
export function Character({
  mood = "idle",
  state,
  activityKey,
  onReady,
  className,
}: {
  mood?: BotMood;
  state?: CharacterState;
  activityKey?: string;
  onReady?: () => void;
  className?: string;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const runtime = useRef<BotRuntime | null>(null);
  const latest = useRef<{ state: CharacterState }>({
    state: "idle",
  });
  const [failed, setFailed] = useState(false);
  const ready = useEffectEvent(() => onReady?.());

  useEffect(() => {
    latest.current.state = state ?? selectBehavior(mood);
    runtime.current?.setState(latest.current.state);
  }, [mood, state, activityKey]);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    loadRuntime()
      .then(() => {
        if (disposed || !svg.current) return;
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const character = new window.GrokCharacter(svg.current, {
          mode: "manual",
          shape: "blob",
          state: latest.current.state,
          color: "black",
          scheme: "light",
          loginWrap: true,
          followPointer: false,
          reduceMotion: motion.matches,
          inkFlat: "var(--bot-body)",
          eyeColor: "var(--bot-eyes)",
          autoTricks: false,
          onChange: ({ state: selected }: { state: string }) => {
            svg.current?.setAttribute("data-state", selected);
          },
        });
        runtime.current = character;
        ready();
        const updateMotion = () => {
          character.reduceMotion = motion.matches;
        };
        const updateVisibility = () => character.setPaused(document.hidden);
        motion.addEventListener("change", updateMotion);
        document.addEventListener("visibilitychange", updateVisibility);
        updateVisibility();
        cleanup = () => {
          motion.removeEventListener("change", updateMotion);
          document.removeEventListener("visibilitychange", updateVisibility);
          character.destroy();
          runtime.current = null;
        };
      })
      .catch((error: unknown) => {
        if (!disposed) setFailed(true);
        console.error("Bot initialization failed", error);
      });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <div
      role="img"
      aria-label="Interactive character"
      data-mood={mood}
      className={cn(
        "relative size-24 shrink-0 [--bot-body:#000000] [--bot-eyes:#ffffff] dark:[--bot-body:var(--foreground)] dark:[--bot-eyes:var(--background)]",
        className,
      )}
    >
      {failed ? (
        <span className="text-xs text-muted-foreground">
          Character unavailable
        </span>
      ) : (
        <svg ref={svg} aria-hidden className="size-full overflow-visible" />
      )}
    </div>
  );
}
