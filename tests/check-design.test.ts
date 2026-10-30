import assert from "node:assert/strict";
import { test } from "node:test";
import { format } from "prettier";
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

test("allows token colors after Prettier wraps their declaration", async () => {
  const content =
    ":root { --focus-ring-glow: 0 0 0 1px #faf9f6, 0 0 0 2px #c2431f, 0 0 6px 1px #c2431f40; }";
  const formatted = await format(content, { parser: "css" });
  assert.match(formatted, /--focus-ring-glow:\n/);
  assert.deepEqual(findBareColors("src/theme.css", content), []);
  assert.deepEqual(findBareColors("src/theme.css", formatted), []);
});

test("allows multiline duration and easing token declarations", () => {
  const content = [
    ":root {",
    "  --duration-enter:",
    "    180ms;",
    "  --ease-enter:",
    "    cubic-bezier(0.1, 0, 0.2, 1);",
    "  --ease-exit:",
    "    ease-out;",
    "}",
  ].join("\n");
  assert.deepEqual(findArbitraryDesignValues("src/theme.css", content), []);
});

test("reports bare values after multiline tokens at their original lines", () => {
  const content = [
    ":root {",
    "  --shadow:",
    "    0 0 0 1px #fff; color: #123456;",
    "  --duration:",
    "    180ms",
    "}",
    ".card {",
    "  color: #000;",
    "  transition: color 250ms cubic-bezier(0.1, 0, 0.2, 1);",
    "  animation: pulse 1.6s ease-out;",
    "}",
  ].join("\n");
  assert.deepEqual(
    findBareColors("src/theme.css", content).map(({ line }) => line),
    [3, 8],
  );
  assert.deepEqual(
    findArbitraryDesignValues("src/theme.css", content).map(
      ({ rule, line }) => ({ rule, line }),
    ),
    [
      { rule: "MOT-01", line: 9 },
      { rule: "MOT-02", line: 9 },
      { rule: "MOT-01", line: 10 },
      { rule: "MOT-02", line: 10 },
    ],
  );
});

test("keeps comments and quoted delimiters inside multiline tokens", () => {
  const content = [
    ":root {",
    "  --preview:",
    "    /* ; } */",
    "    url(\"data:image/svg+xml;utf8,<svg fill='#fff'/>\")",
    "    180ms ease-out;",
    "}",
    "/*",
    "  #123456 250ms ease-out",
    "*/",
    ".card { color: #000; transition: color 300ms ease-out; }",
  ].join("\n");
  assert.deepEqual(
    findBareColors("src/theme.css", content).map(({ line }) => line),
    [10],
  );
  assert.deepEqual(
    findArbitraryDesignValues("src/theme.css", content).map(
      ({ rule, line }) => ({ rule, line }),
    ),
    [
      { rule: "MOT-01", line: 10 },
      { rule: "MOT-02", line: 10 },
    ],
  );
});

test("still checks variable references inside multiline tokens", () => {
  const violations = findUndefinedVars([
    {
      file: "src/theme.css",
      content: ":root {\n  --shadow:\n    0 0 0 1px var(--missing);\n}",
    },
  ]);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].line, 3);
  assert.match(violations[0].message, /--missing/);
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
