import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";
import { previewActions, scenes, selectBehavior } from "./behavior";

test("normal answers only use writing; unmatched answers use confused", () => {
  assert.equal(selectBehavior("responding"), "writing");
  assert.equal(selectBehavior("unmatched"), "confused");
  assert.equal(selectBehavior("listening"), "listening");
  assert.ok(!("hum" in scenes));
  assert.ok(!("explore" in scenes));
  assert.ok(previewActions.some(([state]) => state === "humming"));
});

test("all engine playlists exclude exactly the rejected eyes without dropping any state", () => {
  const context = vm.createContext({ window: {} });
  for (const file of ["geometry-data.js", "src/tables.js"])
    vm.runInContext(
      readFileSync(new URL(`./vendor/${file}`, import.meta.url), "utf8"),
      context,
    );
  const lists: Record<string, number[]> =
    context.window.GROK_TABLES.EYE_PLAYLIST;
  assert.equal(Object.keys(lists).length, 39);
  assert.equal(context.window.GROK_GEO.eyes.length, 25);
  assert.deepEqual(
    Array.from(lists.idle),
    [0],
    "quiet gaps hold neutral eyes instead of starting a second expression cycle",
  );
  for (const list of Object.values(lists)) {
    assert.ok(list.length);
    assert.ok(list.every((eye) => eye !== 7 && eye !== 8));
  }
  assert.deepEqual(Array.from(lists.working), [16, 11, 10]);
  assert.deepEqual(Array.from(lists.listening), [10]);
  assert.deepEqual(Array.from(lists.spawning), [3, 0]);
  assert.deepEqual(Array.from(lists.angry), [16]);
  const retained = new Set(Object.values(lists).flat());
  for (const eye of [
    0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
    24,
  ])
    assert.ok(retained.has(eye));
});
