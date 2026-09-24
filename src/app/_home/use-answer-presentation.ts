"use client";

import { useEffect, useRef, useState } from "react";
import {
  createAnswerTimeline,
  initialPresentation,
  SEND_MS,
  type AnswerPresentation,
  type PresentationFrame,
} from "./answer-presentation";
import type { Message } from "./types";

export function useAnswerPresentation(messages: readonly Message[]) {
  const [history] = useState(
    () => new Set(messages.map((message) => message.id)),
  );
  const latest = messages.at(-1);
  const message = latest && !history.has(latest.id) ? latest : undefined;
  const id = message?.id;
  const answer = message?.answer;
  const error = message?.error;
  const origin = useRef<{ id: string; at: number } | null>(null);
  const [playback, setPlayback] = useState<{
    id: string;
    frame: AnswerPresentation;
  } | null>(null);

  useEffect(() => {
    if (!id) {
      origin.current = null;
      return;
    }
    if (origin.current?.id !== id)
      origin.current = { id, at: performance.now() };
    const startedAt = origin.current.at;
    const frames: PresentationFrame[] = error
      ? [{ ...initialPresentation, phase: "error", atMs: 0 }]
      : answer
        ? createAnswerTimeline(answer, performance.now() - startedAt)
        : [
            { ...initialPresentation, atMs: 0 },
            { ...initialPresentation, phase: "waiting", atMs: SEND_MS },
          ];
    let index = 0;
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const advance = () => {
      if (disposed) return;
      const elapsed = performance.now() - startedAt;
      while (index + 1 < frames.length && frames[index + 1].atMs <= elapsed)
        index++;
      setPlayback({ id, frame: frames[index] });
      const next = frames[index + 1];
      if (next) timer = setTimeout(advance, Math.max(0, next.atMs - elapsed));
    };
    timer = setTimeout(advance, 0);
    return () => {
      disposed = true;
      clearTimeout(timer);
    };
  }, [id, answer, error]);

  return {
    messageId: id,
    frame: id
      ? playback?.id === id
        ? playback.frame
        : initialPresentation
      : undefined,
  };
}
