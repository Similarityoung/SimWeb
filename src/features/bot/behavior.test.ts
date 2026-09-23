import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

test("all engine playlists exclude exactly the rejected eyes without dropping any state", () => {
  const context = vm.createContext({ window: {} });
  for (const file of ["geometry-data.js", "src/tables.js"])
    vm.runInContext(
      readFileSync(new URL(`./vendor/${file}`, import.meta.url), "utf8"),
      context,
    );
  const lists: Record<string, number[]> =
    context.window.GROK_TABLES.EYE_PLAYLIST;
  const states: string[] = Array.from(
    context.window.GROK_TABLES.GROUPS.flatMap(
      (group: { states: string[] }) => group.states,
    ),
  );
  assert.deepEqual(Object.keys(lists).sort(), states.sort());
  assert.deepEqual(
    Array.from(lists.idle),
    [0],
    "quiet gaps hold neutral eyes instead of starting a second expression cycle",
  );
  const eyeCount = context.window.GROK_GEO.eyes.length;
  for (const [state, list] of Object.entries(lists)) {
    assert.ok(list.length, `${state} has no eyes`);
    assert.ok(
      list.every((eye) => eye >= 0 && eye < eyeCount && eye !== 7 && eye !== 8),
      `${state} references an invalid or rejected eye`,
    );
  }
  assert.equal(lists.listening.length, 1);
});
