"use client";

import { Character } from "./character";
import type { BotMood } from "./behavior";
import type { Arrival } from "./scene-controller";
import { useBotScenes } from "./use-bot-scenes";

export type { BotMood } from "./behavior";
export function Bot({
  mood = "idle",
  activityKey,
  completed,
  failed,
  arrival,
  exploreKey,
  className,
}: {
  mood?: BotMood;
  activityKey?: string;
  completed?: boolean;
  failed?: boolean;
  arrival?: Arrival;
  exploreKey?: string;
  className?: string;
}) {
  const scene = useBotScenes({
    mood,
    activityKey,
    completed,
    failed,
    arrival,
    exploreKey,
  });
  return (
    <button
      type="button"
      aria-label="Play with Bot"
      aria-disabled={scene.disabled}
      title="Click to bounce"
      data-scene={scene.scene}
      className="block rounded-full p-0 select-none outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      onClick={() => {
        if (!scene.disabled) scene.cue("tap");
      }}
    >
      <Character
        mood={mood}
        state={scene.state}
        activityKey={activityKey}
        onReady={scene.onReady}
        className={className}
      />
    </button>
  );
}
