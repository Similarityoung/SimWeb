"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useReducer,
  useRef,
  useState,
} from "react";
import { usePageHidden, useReducedMotion } from "@/lib/browser-signals";
import { useTheme } from "next-themes";
import {
  IDLE_PAUSE_MS,
  SLEEP_AFTER_MS,
  type BotMood,
  type BotScene,
} from "./behavior";
import {
  createSceneModel,
  currentMove,
  isAnswerMood,
  sceneReducer,
  type Arrival,
} from "./scene-controller";

export function useBotScenes({
  mood,
  activityKey,
  completed,
  failed,
  arrival,
}: {
  mood: BotMood;
  activityKey?: string;
  completed?: boolean;
  failed?: boolean;
  arrival?: Arrival;
}) {
  const [model, dispatch] = useReducer(sceneReducer, undefined, () =>
    createSceneModel(mood, activityKey, arrival),
  );
  const [ready, setReady] = useState(false);
  const reducedMotion = useReducedMotion();
  const hidden = usePageHidden();
  const { resolvedTheme } = useTheme();
  const previousTheme = useRef<string | undefined>(undefined);
  const cue = useCallback(
    (scene: BotScene) =>
      dispatch({
        type: "cue",
        scene,
        now: performance.now(),
        random: Math.random(),
      }),
    [],
  );
  const end = useCallback(
    (scene: BotScene) => dispatch({ type: "end", scene }),
    [],
  );
  const onReady = useCallback(() => setReady(true), []);
  const wakeOnActivity = useEffectEvent(() => {
    if (model.move?.scene !== "sleep") return;
    if (reducedMotion) end("sleep");
    else cue("wake");
  });

  useEffect(() => {
    dispatch({ type: "base", mood, activityKey, completed, failed });
  }, [mood, activityKey, completed, failed]);
  useEffect(() => {
    if (ready && arrival)
      dispatch({
        type: "arrive",
        arrival,
        now: performance.now(),
        random: Math.random(),
      });
  }, [ready, arrival]);
  useEffect(() => {
    const move = model.move;
    if (!ready || !move || move.duration === null) return;
    const timer = setTimeout(
      () => dispatch({ type: "expire", id: move.id }),
      move.duration,
    );
    return () => clearTimeout(timer);
  }, [ready, model.move]);
  useEffect(() => {
    if (!ready) return;
    if (reducedMotion) {
      end("idle-expression");
      return;
    }
    if (mood !== "idle" || model.move || hidden) return;
    const [min, max] = IDLE_PAUSE_MS;
    const timer = setTimeout(
      () => cue("idle-expression"),
      min + Math.random() * (max - min),
    );
    return () => clearTimeout(timer);
  }, [ready, mood, model.move, hidden, reducedMotion, cue, end]);
  useEffect(() => {
    if (model.hidden !== hidden) dispatch({ type: "visibility", hidden });
  }, [hidden, model.hidden]);
  useEffect(() => {
    if (
      ready &&
      previousTheme.current &&
      resolvedTheme !== previousTheme.current
    )
      cue("theme");
    previousTheme.current = resolvedTheme;
  }, [ready, resolvedTheme, cue]);
  useEffect(() => {
    if (!ready) return;
    let sleepTimer: ReturnType<typeof setTimeout>;
    const resetIdle = () => {
      clearTimeout(sleepTimer);
      if (hidden || isAnswerMood(mood)) return;
      sleepTimer = setTimeout(() => cue("sleep"), SLEEP_AFTER_MS);
    };
    const activity = () => {
      wakeOnActivity();
      resetIdle();
    };
    const events = [
      "pointerdown",
      "pointermove",
      "keydown",
      "wheel",
      "touchmove",
    ];
    for (const event of events)
      document.addEventListener(event, activity, {
        passive: true,
        capture: true,
      });
    resetIdle();
    return () => {
      clearTimeout(sleepTimer);
      for (const event of events)
        document.removeEventListener(event, activity, true);
    };
  }, [ready, mood, hidden, cue]);

  return {
    ...currentMove(model),
    disabled: isAnswerMood(mood) || model.move?.scene === "error",
    cue,
    onReady,
  };
}
