"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useReducer,
  useRef,
  useState,
} from "react";
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
  exploreKey,
}: {
  mood: BotMood;
  activityKey?: string;
  completed?: boolean;
  failed?: boolean;
  arrival?: Arrival;
  exploreKey?: string;
}) {
  const [model, dispatch] = useReducer(sceneReducer, undefined, () =>
    createSceneModel(mood, activityKey),
  );
  const [ready, setReady] = useState(false);
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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      end("sleep");
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
    if (!move || move.duration === null) return;
    const timer = setTimeout(
      () => dispatch({ type: "expire", id: move.id }),
      move.duration,
    );
    return () => clearTimeout(timer);
  }, [model.move]);
  useEffect(() => {
    if (!ready) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      if (motion.matches || exploreKey) {
        end("idle-expression");
        return;
      }
      if (mood !== "idle" || model.move || model.hidden) return;
      const [min, max] = IDLE_PAUSE_MS;
      timer = setTimeout(
        () => cue("idle-expression"),
        min + Math.random() * (max - min),
      );
    };
    schedule();
    motion.addEventListener("change", schedule);
    return () => {
      clearTimeout(timer);
      motion.removeEventListener("change", schedule);
    };
  }, [ready, mood, model.move, model.hidden, exploreKey, cue, end]);
  useEffect(() => {
    if (!ready || !exploreKey) return;
    const timer = setTimeout(() => cue("explore"), 500);
    return () => {
      clearTimeout(timer);
      end("explore");
    };
  }, [ready, exploreKey, cue, end]);
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
      if (document.hidden || isAnswerMood(mood)) return;
      sleepTimer = setTimeout(() => cue("sleep"), SLEEP_AFTER_MS);
    };
    const activity = () => {
      wakeOnActivity();
      resetIdle();
    };
    const visibility = () => {
      dispatch({ type: "visibility", hidden: document.hidden });
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
    document.addEventListener("visibilitychange", visibility);
    resetIdle();
    return () => {
      clearTimeout(sleepTimer);
      for (const event of events)
        document.removeEventListener(event, activity, true);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [ready, mood, cue]);

  return {
    ...currentMove(model),
    disabled: isAnswerMood(mood) || model.move?.scene === "error",
    cue,
    onReady,
  };
}
