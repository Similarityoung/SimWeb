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

test("home can reuse public cards and types, but not server loaders or Bot internals", async () => {
  assert.equal(
    await restricted(
      "src/app/_home/probe.ts",
      "@/components/writing/article-card",
    ),
    false,
  );
  assert.equal(
    await restricted("src/app/_home/probe.ts", "@/lib/writing/types"),
    false,
  );
  assert.equal(
    await restricted("src/app/_home/probe.ts", "@/lib/writing/content.server"),
    true,
  );
  assert.equal(
    await restricted(
      "src/app/_home/probe.ts",
      "@/components/bot/runtime.client",
    ),
    true,
  );
  assert.equal(await restricted("src/app/_home/probe.ts", "@/app/page"), true);
});

test("shared UI and data do not depend on routes or other domains", async () => {
  assert.equal(
    await restricted("src/components/writing/probe.ts", "@/app/_home/types"),
    true,
  );
  assert.equal(
    await restricted("src/components/bot/probe.ts", "../projects/project-card"),
    true,
  );
  assert.equal(
    await restricted("src/components/ui/probe.ts", "@/lib/writing/types"),
    true,
  );
  assert.equal(
    await restricted(
      "src/lib/writing/probe.ts",
      "@/components/writing/article-card",
    ),
    true,
  );
  assert.equal(await restricted("src/lib/writing/probe.ts", "./types"), false);
});

test("answer owns orchestration, while shared contracts and source data stay independent", async () => {
  assert.equal(
    await restricted("src/lib/answer/service.server.ts", "@/app/_home/types"),
    true,
  );
  assert.equal(
    await restricted(
      "src/lib/answer/context.server.ts",
      "@/lib/writing/content.server",
    ),
    false,
  );
  assert.equal(
    await restricted("src/lib/answer/schema.ts", "./service.server"),
    true,
  );
  assert.equal(
    await restricted("src/app/_home/probe.ts", "@/lib/answer/service.server"),
    true,
  );
  assert.equal(
    await restricted("src/app/_home/probe.ts", "@/lib/answer/schema"),
    false,
  );
  assert.equal(
    await restricted("src/lib/writing/probe.ts", "@/lib/answer/schema"),
    true,
  );
});
