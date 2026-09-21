import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getArticle, getArticleSummaries } from "./content.server";
import { entries } from "./entries";

test("only selected non-draft articles enter the public catalog", () => {
  const summaries = getArticleSummaries();
  assert.equal(summaries.length, 4);
  assert.equal(getArticleSummaries("notes").length, 3);
  assert.equal(getArticleSummaries("thoughts").length, 1);
  for (const entry of entries) {
    const source = matter(
      readFileSync(
        path.join(process.cwd(), "content/posts", entry.file),
        "utf8",
      ),
    );
    const summary = summaries.find((article) => article.id === entry.id);
    assert.ok(summary);
    assert.equal(source.data.draft, false);
    assert.equal(summary.title, source.data.title);
    assert.equal(summary.date, new Date(source.data.date).toISOString());
    assert.equal(summary.summary, entry.summary);
    assert.equal("body" in summary, false);
    assert.equal("file" in summary, false);
  }
});

test("a direct article query returns original content only for the correct kind and slug", () => {
  const article = getArticle("notes", "pixiu-grpc-streaming");
  assert.ok(article?.body.includes("UnknownServiceHandler"));
  assert.equal(getArticle("thoughts", "pixiu-grpc-streaming"), undefined);
  assert.equal(getArticle("notes", "unselected-article"), undefined);
  assert.equal(getArticle("notes", "../../README"), undefined);
});
