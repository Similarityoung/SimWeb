"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { loadRuntime, type BotRuntime } from "./runtime.client";

export type BotMood = "idle" | "listening" | "thinking" | "happy";

export function Bot({
  mood = "idle",
  className,
}: {
  mood?: BotMood;
  className?: string;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const runtime = useRef<BotRuntime | null>(null);
  const latestMood = useRef(mood);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    latestMood.current = mood;
    runtime.current?.setState(mood);
  }, [mood]);

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
          state: latestMood.current,
          color: "black",
          scheme: "light",
          loginWrap: true,
          followPointer: !motion.matches,
          inkFlat: "var(--bot-body)",
          eyeColor: "var(--bot-eyes)",
          reduceMotion: motion.matches,
        });
        runtime.current = character;
        const updateMotion = () => {
          character.reduceMotion = motion.matches;
          character.setFollowPointer(!motion.matches);
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
