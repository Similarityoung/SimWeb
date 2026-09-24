import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const context = vm.createContext({ window: {}, performance: { now: () => 0 } });
for (const file of ["math", "tricks"])
  vm.runInContext(
    readFileSync(new URL(`./vendor/src/${file}.js`, import.meta.url), "utf8"),
    context,
  );
const { startTrick, evalTrick } = context.window.GROK_TRICKS;

test("completion turns exactly once, hops once, then emits particles at landing", () => {
  for (const dir of [-1, 1]) {
    const trick = { ...startTrick("spinHop", false), dir };
    let previousTurn = 0;
    for (let now = 0; now < 700; now += 10) {
      const frame = evalTrick(trick, now);
      const turn = frame.turn * dir;
      assert.ok(turn >= previousTurn && turn < Math.PI * 2);
      assert.equal(frame.hop, 0);
      assert.equal(frame.wantBurst, false);
      previousTurn = turn;
    }
    for (let now = 700; now < 1200; now += 10) {
      const frame = evalTrick(trick, now);
      assert.equal(frame.turn * dir, Math.PI * 2);
      assert.ok(frame.hop <= 0);
      assert.equal(frame.wantBurst, false);
      assert.equal(frame.done, false);
    }
    assert.equal(evalTrick(trick, 950).hop, -36);
    for (const now of [1200, 1800]) {
      const landed = evalTrick(trick, now);
      assert.equal(landed.hop, 0);
      assert.equal(landed.wantBurst, true);
      assert.equal(landed.done, true);
    }
    // Consuming the finished trick prevents any later frame from replaying it.
    assert.equal(evalTrick(null, 1810).wantBurst, false);
  }
});

test("reduced motion does not start completion movement or particles", () => {
  const trick = startTrick("spinHop", true);
  assert.equal(trick, null);
  const frame = evalTrick(trick, 1200);
  assert.equal(frame.turn, null);
  assert.equal(frame.hop, 0);
  assert.equal(frame.wantBurst, false);
});
