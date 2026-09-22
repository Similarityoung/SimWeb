import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const context = vm.createContext({ window: {} });
for (const file of ["math", "tables", "pose"])
  vm.runInContext(
    readFileSync(new URL(`./vendor/src/${file}.js`, import.meta.url), "utf8"),
    context,
  );
const { applyPose, nextGaze } = context.window.GROK_POSE;

test("listening acknowledges once at any refresh rate, then stays quiet until re-entered", () => {
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

test("quiet listening keeps its gaze steady", () => {
  for (let frame = 0; frame < 20; frame++) {
    const gaze = nextGaze("listening");
    assert.equal(gaze.x, 0);
    assert.equal(gaze.y, 0);
  }
});
