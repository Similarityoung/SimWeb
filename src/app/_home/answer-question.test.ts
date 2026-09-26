import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AnswerRateLimitError,
  answerQuestion,
  resolveReference,
  validateCatalog,
} from "./answer-question";
import type { PublicCatalog } from "./types";

const catalog: PublicCatalog = {
  projects: ["dubbo-go-pixiu", "pixiu-admin"].map((id) => ({
    id,
    title: id,
    summary: "A project",
    role: "Contributor",
    href: `https://github.com/example/${id}`,
    tags: [],
  })),
  articles: [
    "pixiu-grpc-streaming",
    "go-design-philosophy",
    "paper-reading-prompts",
    "thinking-through-problems",
  ].map((id) => ({
    id,
    slug: id,
    kind: id === "thinking-through-problems" ? "thoughts" : "notes",
    title: id,
    summary: "An article",
    date: "2025-01-01T00:00:00.000Z",
    tags: [],
    href: `/notes/${id}`,
  })),
};

test("free-text questions use the model endpoint when enabled, with validated references", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async (input, init) => {
    assert.equal(input, "/api/answer");
    assert.equal(JSON.parse(String(init?.body)).text, "Redis");
    called = true;
    return Response.json({
      kind: "answer",
      text: "A concise grounded answer.",
      references: [{ type: "article", id: "go-design-philosophy" }],
    });
  };
  try {
    const answer = await answerQuestion(
      { text: "Redis" },
      catalog,
      undefined,
      true,
    );
    assert.equal(called, true);
    assert.equal(answer.references[0]?.id, "go-design-philosophy");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a public rate limit reaches the conversation as a distinct error", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 429 });
  try {
    await assert.rejects(
      answerQuestion({ text: "Redis" }, catalog, undefined, true),
      AnswerRateLimitError,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("English plural topic names and Chinese questions resolve to current content", async () => {
  assert.equal(
    (await answerQuestion({ text: "Show me your projects" }, catalog))
      .references[0]?.type,
    "project",
  );
  assert.equal(
    (await answerQuestion({ text: "我想看笔记" }, catalog)).references[0]?.id,
    "pixiu-grpc-streaming",
  );
});

test("a topic shortcut wins over incidental keywords", async () => {
  const answer = await answerQuestion({ text: "Go", topic: "notes" }, catalog);
  assert.equal(answer.references.length, 3);
});

test("article topic cards follow the public catalog instead of fixed sample IDs", async () => {
  const changed: PublicCatalog = {
    ...catalog,
    articles: [
      { ...catalog.articles[0], id: "new-note", slug: "new-note" },
      { ...catalog.articles[3], id: "new-thought", slug: "new-thought" },
    ],
  };
  assert.deepEqual(
    (await answerQuestion({ text: "notes" }, changed)).references,
    [{ type: "article", id: "new-note" }],
  );
  assert.deepEqual(
    (await answerQuestion({ text: "thoughts" }, changed)).references,
    [{ type: "article", id: "new-thought" }],
  );
});

test("greetings do not get swallowed by broad Chinese or English substring matches", async () => {
  assert.match((await answerQuestion({ text: "你好" }, catalog)).text, /Hello/);
  assert.match(
    (await answerQuestion({ text: "this is unrecognized" }, catalog)).text,
    /prepared answer/,
  );
});

test("empty and overlong questions are rejected", async () => {
  await assert.rejects(
    answerQuestion({ text: "  " }, catalog),
    /between 1 and 300/,
  );
  await assert.rejects(
    answerQuestion({ text: "a".repeat(301) }, catalog),
    /between 1 and 300/,
  );
});

test("references are resolved by both type and ID; missing content is an error", () => {
  validateCatalog(catalog);
  assert.equal(
    resolveReference({ type: "article", id: "go-design-philosophy" }, catalog)
      .type,
    "article",
  );
  assert.throws(
    () =>
      resolveReference(
        { type: "project", id: "go-design-philosophy" },
        catalog,
      ),
    /Unknown project/,
  );
  assert.throws(
    () =>
      validateCatalog({
        ...catalog,
        projects: [...catalog.projects, catalog.projects[0]],
      }),
    /Duplicate/,
  );
});

test("an aborted answer cannot generate a late response", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    answerQuestion({ text: "notes" }, catalog, controller.signal),
    { name: "AbortError" },
  );
});

test("answer classification is explicit and independent of display text", async () => {
  assert.equal(
    (await answerQuestion({ text: "notes" }, catalog)).kind,
    "answer",
  );
  assert.equal(
    (await answerQuestion({ text: "你好" }, catalog)).kind,
    "answer",
  );
  assert.equal(
    (await answerQuestion({ text: "unknown question" }, catalog)).kind,
    "unmatched",
  );
});
