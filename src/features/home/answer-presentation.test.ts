import assert from "node:assert/strict";
import { test } from "node:test";
import { createAnswerTimeline, CARD_MS, SEND_MS } from "./answer-presentation";
import { preparedAnswers } from "./presets";

test("prepared answers reveal text before individual, usable cards within the agreed budget", () => {
  for (const answer of Object.values(preparedAnswers)) {
    const frames = createAnswerTimeline(answer);
    const complete = frames.find((frame) => frame.phase === "complete")!;
    assert.ok(
      Math.round(complete.atMs) >= (answer.references.length ? 3_900 : 3_600) &&
        complete.atMs <= 6_000,
    );
    assert.equal(frames[0].phase, "sending");
    assert.equal(frames.at(-1)?.phase, "complete");
    for (const [index, frame] of frames.entries()) {
      assert.ok(frame.atMs >= (frames[index - 1]?.atMs ?? 0));
      if (frame.visibleCards)
        assert.equal(frame.textLength, answer.text.length);
    }
    const cards = frames.filter(
      (frame) => frame.phase === "cards" && frame.visibleCards,
    );
    assert.deepEqual(
      cards.map((frame) => frame.visibleCards),
      answer.references.map((_, index) => index + 1),
    );
    cards
      .slice(1)
      .forEach((frame, index) =>
        assert.equal(Math.round(frame.atMs - cards[index].atMs), CARD_MS),
      );
    assert.equal(complete.visibleCards, answer.references.length);
  }
});

test("late answers wait for actual data, then begin the same presentation", () => {
  const answer = preparedAnswers.projects;
  const frames = createAnswerTimeline(answer, 8_000);
  assert.equal(
    frames.find((frame) => frame.phase === "waiting")?.atMs,
    SEND_MS,
  );
  assert.equal(
    frames.find((frame) => frame.phase === "streaming")?.atMs,
    8_000,
  );
  assert.equal(
    frames.find((frame) => frame.phase === "complete")?.visibleCards,
    2,
  );
});

test("answers without references skip cards; long text has time to unfold", () => {
  const short = createAnswerTimeline({
    kind: "answer",
    text: "Hello 👋",
    references: [],
  });
  const long = createAnswerTimeline({
    kind: "answer",
    text: "中文笔记与 English words。 ".repeat(100),
    references: [],
  });
  assert.ok(!short.some((frame) => frame.phase === "cards"));
  assert.equal(
    short.find((frame) => frame.phase === "complete")?.textLength,
    "Hello 👋".length,
  );
  assert.ok(long.at(-1)!.atMs > short.at(-1)!.atMs);
});
