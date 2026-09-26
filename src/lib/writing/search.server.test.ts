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

test("specific title matches outrank and exclude incidental body mentions", () => {
  const matches = rankArticles("What is Redis?", [
    item("other", "Storage", "Redis appears in a passing example"),
    item("redis", "Redis internals", "An overview of data structures"),
  ]);
  assert.deepEqual(
    matches.map(({ article }) => article.article.id),
    ["redis"],
  );
});

test("generic or unrelated questions do not consume a model request", () => {
  const published = [item("redis", "Redis internals", "Memory layout")];
  assert.deepEqual(rankArticles("What are your notes?", published), []);
  assert.deepEqual(rankArticles("Kafka", published), []);
});

test("a specific question includes the relevant passage and drops incidental cards", () => {
  const matches = rankArticles("Redis RDB AOF 区别", [
    item(
      "redis",
      "Redis",
      `Redis overview. ${"other details. ".repeat(90)}\n## 持久化\nRDB stores snapshots. AOF replays writes.`,
    ),
    item("mention", "Agent notes", "Redis is mentioned once."),
  ]);
  assert.deepEqual(
    matches.map(({ article }) => article.article.id),
    ["redis"],
  );
  assert.match(matches[0].excerpt, /RDB stores snapshots\. AOF replays writes/);
});
