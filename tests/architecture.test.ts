import assert from "node:assert/strict";
import { test } from "node:test";
import { ESLint } from "eslint";

const eslint = new ESLint();
async function restricted(filePath: string, specifier: string) {
  const [result] = await eslint.lintText(
    `import ${JSON.stringify(specifier)};\n`,
    { filePath },
  );
  return result.messages.some(
    (message) => message.ruleId === "no-restricted-imports",
  );
}

test("home can reuse public cards but cannot import content loaders or private engine files", async () => {
  assert.equal(
    await restricted(
      "src/features/home/probe.ts",
      "@/features/writing/article-card",
    ),
    false,
  );
  assert.equal(
    await restricted(
      "src/features/home/probe.ts",
      "@/features/writing/content.server",
    ),
    true,
  );
  assert.equal(
    await restricted("src/features/home/probe.ts", "../writing/content.server"),
    true,
  );
  assert.equal(
    await restricted(
      "src/features/home/probe.ts",
      "@/features/bot/runtime.client",
    ),
    true,
  );
  assert.equal(
    await restricted("src/features/home/probe.ts", "@/app/page"),
    true,
  );
});

test("business modules cannot point back to home and shared UI cannot depend on features", async () => {
  assert.equal(
    await restricted("src/features/writing/probe.ts", "@/features/home/types"),
    true,
  );
  assert.equal(
    await restricted("src/features/bot/probe.ts", "../projects/types"),
    true,
  );
  assert.equal(
    await restricted("src/components/ui/probe.ts", "@/features/writing/types"),
    true,
  );
  assert.equal(
    await restricted("src/features/writing/probe.ts", "./types"),
    false,
  );
});
