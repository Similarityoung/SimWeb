import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { behaviors, previewActions, scenes } from "./behavior";

const context = vm.createContext({ window: {}, performance: { now: () => 0 } });
for (const file of ["geometry-data", "src/math", "src/tables", "src/pose"])
  vm.runInContext(
    readFileSync(new URL(`./vendor/${file}.js`, import.meta.url), "utf8"),
    context,
  );
const { GROK_GEO, GROK_TABLES, GROK_POSE } = context.window;

test("available engine states exclude the rejected eyes", () => {
  const lists: Record<string, number[]> = GROK_TABLES.EYE_PLAYLIST;
  for (const state of [
    ...Object.values(behaviors).flat(),
    ...Object.values(scenes).flatMap((scene) => scene.choices),
    ...previewActions.map(([state]) => state),
  ])
    assert.ok(lists[state], `${state} has no engine playlist`);
  assert.deepEqual(
    Array.from(lists.idle),
    [0],
    "quiet gaps hold neutral eyes instead of starting a second expression cycle",
  );
  const eyeCount = GROK_GEO.eyes.length;
  for (const [state, list] of Object.entries(lists)) {
    assert.ok(list.length, `${state} has no eyes`);
    assert.ok(
      list.every((eye) => eye >= 0 && eye < eyeCount && eye !== 7 && eye !== 8),
      `${state} references an invalid or rejected eye`,
    );
  }
  assert.equal(lists.listening.length, 1);
});

test("listening acknowledges once at any refresh rate, then stays quiet until re-entered", () => {
  const { applyPose, nextGaze } = GROK_POSE;
  const gaze = nextGaze("listening");
  assert.equal(gaze.x, 0);
  assert.equal(gaze.y, 0);
  for (const fps of [30, 60, 120]) {
    const ctx = { nodUntil: 0, nodEnd: 0 };
    // Hold the global breathing clock fixed to isolate the entry gesture.
    const rest = applyPose("listening", 0, 60, 60_000, ctx);
    let nods = 0;
    let moving = false;
    let peak = 0;
    for (let frame = 0; frame <= 10 * fps; frame++) {
      const elapsed = frame / fps;
      const pose = applyPose("listening", 0, elapsed, elapsed * 1000, ctx);
      const displacement = pose.ty - rest.ty;
      const active = displacement > 0.01;
      if (active && !moving) nods++;
      moving = active;
      peak = Math.max(peak, displacement);
      if (elapsed >= 0.6) assert.equal(displacement, 0);
    }
    assert.equal(nods, 1);
    assert.ok(peak > 4);
    assert.ok(applyPose("listening", 0, 0.25, 20_250, ctx).ty > rest.ty);
  }
});
