import assert from "node:assert/strict";
import { test } from "node:test";
import {
  findBareColors,
  findUndefinedVars,
  scanProject,
} from "../scripts/check-design";

test("flags bare colors outside token definitions", () => {
  const violations = findBareColors(
    "src/example.tsx",
    'const color = "#123456";',
  );
  assert.equal(violations.length, 1);
  assert.match(violations[0].message, /#123456/);
});

test("allows colors defined as local custom properties", () => {
  assert.deepEqual(
    findBareColors("src/globals.css", ":root { --accent: #c2431f; }"),
    [],
  );
  assert.deepEqual(
    findBareColors("src/bot.tsx", 'className="[--bot-body:#000000]"'),
    [],
  );
  assert.deepEqual(
    findBareColors("src/theme.css", "--shadow: 0 0 0 1px #fff, 0 0 6px #000;"),
    [],
  );
  assert.equal(
    findBareColors("src/theme.css", "--accent: #fff; color: #000;").length,
    1,
  );
});

test("ignores colors in comments", () => {
  assert.deepEqual(findBareColors("src/example.tsx", "// #ffffff"), []);
  assert.deepEqual(
    findBareColors("src/example.tsx", "const x = 1; // #ffffff"),
    [],
  );
  assert.deepEqual(
    findBareColors("src/example.css", "/* #ffffff */ :root {}"),
    [],
  );
});

test("reports undefined variables but allows runtime-provided ones", () => {
  const violations = findUndefinedVars([
    { file: "src/tokens.css", content: ":root { --accent: red; }" },
    {
      file: "src/example.tsx",
      content:
        'const a = "var(--accent)"; const b = "var(--missing)"; const c = "var(--radix-select-trigger-width)";',
    },
  ]);
  assert.equal(violations.length, 1);
  assert.match(violations[0].message, /--missing/);
});

test("current source passes the design check", () => {
  assert.deepEqual(scanProject(process.cwd()), []);
});
