import assert from "node:assert/strict";
import test from "node:test";
import { rankArticles } from "./search.server";
import type { PublishedArticle } from "./catalog";

const item = (id: string, title: string, body: string): PublishedArticle => ({
  file: `${id}.md`,
  article: {
    id,
    slug: id,
    kind: "notes",
    title,
    summary: "A published note",
    tags: [],
    date: "2026-01-01T00:00:00.000Z",
    href: `/notes/${id}`,
    body,
  },
});

test("specific title matches outrank incidental body mentions", () => {
  const matches = rankArticles("What is Redis?", [
    item("other", "Storage", "Redis appears in a passing example"),
    item("redis", "Redis internals", "An overview of data structures"),
  ]);
  assert.deepEqual(
    matches.map(({ article }) => article.article.id),
    ["redis", "other"],
  );
});

test("generic or unrelated questions do not consume a model request", () => {
  const published = [item("redis", "Redis internals", "Memory layout")];
  assert.deepEqual(rankArticles("What are your notes?", published), []);
  assert.deepEqual(rankArticles("Kafka", published), []);
});
