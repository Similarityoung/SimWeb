import assert from "node:assert/strict";
import { test } from "node:test";
import {
  HIGHLIGHT_TRANSITION,
  LAYOUT_TRANSITION,
  respectReducedMotion,
} from "./motion";

test("shared motion transitions keep their base timing", () => {
  assert.equal(LAYOUT_TRANSITION.duration, 0.56);
  assert.deepEqual(LAYOUT_TRANSITION.ease, [0.22, 1, 0.36, 1]);
  assert.equal(HIGHLIGHT_TRANSITION.duration, 0.2);
  assert.deepEqual(HIGHLIGHT_TRANSITION.ease, [0.165, 0.84, 0.44, 1]);
});

test("reduced motion stops shared transitions without mutating them", () => {
  const reduced = respectReducedMotion(HIGHLIGHT_TRANSITION, true);
  assert.deepEqual(reduced, { ...HIGHLIGHT_TRANSITION, duration: 0, delay: 0 });
  assert.equal(HIGHLIGHT_TRANSITION.duration, 0.2);
  assert.equal(
    respectReducedMotion(HIGHLIGHT_TRANSITION, false),
    HIGHLIGHT_TRANSITION,
  );
});
