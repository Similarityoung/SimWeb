import { createAnswerChunks } from "./answer-chunks";
import type { Answer } from "./types";

export type PresentationPhase =
  "sending" | "waiting" | "streaming" | "cards" | "complete" | "error";

export type AnswerPresentation = {
  phase: PresentationPhase;
  textLength: number;
  visibleCards: number;
};

export type PresentationFrame = AnswerPresentation & { atMs: number };

export const SEND_MS = 1_000;
export const CARD_MS = 300;
export const initialPresentation: AnswerPresentation = {
  phase: "sending",
  textLength: 0,
  visibleCards: 0,
};

// Local presentation timing; the answer source and its network timing are separate.
export function createAnswerTimeline(answer: Answer, readyAtMs = 0) {
  const chunks = createAnswerChunks(answer.text);
  const weight = chunks.reduce((total, chunk) => total + chunk.delayMs, 0);
  const duration = Math.max(2_600, chunks.length * 140);
  const frames: PresentationFrame[] = [{ ...initialPresentation, atMs: 0 }];
  if (readyAtMs > SEND_MS)
    frames.push({ ...initialPresentation, phase: "waiting", atMs: SEND_MS });
  let atMs = Math.max(SEND_MS, readyAtMs);
  let textLength = 0;
  frames.push({ ...initialPresentation, phase: "streaming", atMs });
  for (const chunk of chunks) {
    atMs += (chunk.delayMs / weight) * duration;
    textLength += chunk.content.length;
    frames.push({ phase: "streaming", textLength, visibleCards: 0, atMs });
  }
  if (answer.references.length) {
    frames.push({ phase: "cards", textLength, visibleCards: 0, atMs });
    answer.references.forEach((_, index) => {
      atMs += CARD_MS;
      frames.push({
        phase: "cards",
        textLength,
        visibleCards: index + 1,
        atMs,
      });
    });
  }
  const complete = { textLength, visibleCards: answer.references.length };
  frames.push({ ...complete, phase: "complete", atMs });
  return frames;
}
