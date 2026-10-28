import assert from "node:assert/strict";
import { test } from "node:test";
import {
  findArbitraryDesignValues,
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

test("flags arbitrary radius and motion values", () => {
  const violations = findArbitraryDesignValues(
    "src/example.tsx",
    'className="rounded-[10px] duration-[180ms] ease-[cubic-bezier(.2,.8,.2,1)]"',
  );
  assert.deepEqual(
    violations.map(({ rule }) => rule),
    ["VIS-04", "MOT-01", "MOT-02"],
  );
});

test("allows arbitrary values that reference tokens", () => {
  assert.deepEqual(
    findArbitraryDesignValues(
      "src/example.tsx",
      'className="rounded-[var(--radius-panel)] duration-[var(--motion-base)] ease-[var(--ease-enter)]"',
    ),
    [],
  );
});

test("flags raw CSS durations and easing outside token definitions", () => {
  const violations = findArbitraryDesignValues(
    "src/example.css",
    ":root { --duration-x: 120ms; --ease-x: cubic-bezier(0.1, 0, 0.2, 1); }\n.x { animation: pulse 1.6s ease-out; }",
  );
  assert.deepEqual(
    violations.map(({ rule }) => rule),
    ["MOT-01", "MOT-02"],
  );
  assert.match(violations[0].message, /1\.6s/);
  assert.match(violations[1].message, /ease-out/);
});

test("flags raw duration utilities but allows reduced-motion resets", () => {
  assert.deepEqual(
    findArbitraryDesignValues(
      "src/example.tsx",
      'className="transition-colors duration-200 ease-out"',
    ).map(({ rule }) => rule),
    ["MOT-01", "MOT-02"],
  );
  assert.deepEqual(
    findArbitraryDesignValues(
      "src/example.css",
      "@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; transition-duration: 0s !important; } }",
    ),
    [],
  );
});

test("current source passes the design check", () => {
  assert.deepEqual(scanProject(process.cwd()), []);
});
