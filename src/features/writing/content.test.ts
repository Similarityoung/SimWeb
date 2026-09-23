import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { readPublishedArticles } from "./catalog";
import { getArticle, getArticleSummaries } from "./content.server";

function article(slug: string, extra = ""): string {
  return `---
title: ${slug}
type: notes
date: 2025-01-01
draft: false
slug: ${slug}
summary: A short summary
categories: [Go]
tags: [study]
${extra}---
Body for ${slug}`;
}

test("published articles come from frontmatter; drafts and non-article files stay out", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "simweb-writing-"));
  try {
    mkdirSync(path.join(directory, "Go"));
    mkdirSync(path.join(directory, "_Templates"));
    writeFileSync(path.join(directory, "README.md"), "No frontmatter");
    writeFileSync(
      path.join(directory, "_Templates", "template.md"),
      "No frontmatter",
    );
    writeFileSync(
      path.join(directory, "Go", "published.md"),
      article("a-note"),
    );
    writeFileSync(
      path.join(directory, "Go", "draft.md"),
      article("draft-note").replace("draft: false", "draft: true"),
    );
    const result = readPublishedArticles(directory);
    assert.equal(result.length, 1);
    assert.equal(result[0].article.href, "/notes/a-note");
    assert.equal(result[0].article.body.trim(), "Body for a-note");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("invalid publication metadata and duplicate slugs fail before publication", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "simweb-writing-"));
  try {
    writeFileSync(path.join(directory, "one.md"), article("same-slug"));
    writeFileSync(path.join(directory, "two.md"), article("same-slug"));
    assert.throws(() => readPublishedArticles(directory), /duplicate slug/);
    writeFileSync(
      path.join(directory, "two.md"),
      article("second-slug").replace("type: notes", "type: unknown"),
    );
    assert.throws(() => readPublishedArticles(directory), /type must be/);
    writeFileSync(
      path.join(directory, "two.md"),
      article("second-slug").replace("summary: A short summary\n", ""),
    );
    assert.throws(() => readPublishedArticles(directory), /summary must be/);
    writeFileSync(
      path.join(directory, "two.md"),
      article("second-slug").replace("draft: false\n", ""),
    );
    assert.throws(() => readPublishedArticles(directory), /draft must be/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("server queries expose summaries and original bodies at the matching route", () => {
  const summaries = getArticleSummaries();
  assert.ok(summaries.length > 0);
  for (const summary of summaries) {
    assert.equal("body" in summary, false);
    assert.equal("file" in summary, false);
    assert.ok(getArticle(summary.kind, summary.slug)?.body);
  }
  assert.equal(getArticle("notes", "../../README"), undefined);
});
