import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { syncWriting } from "../scripts/sync-writing";

const published = `---
title: Published
type: notes
date: 2025-01-01
draft: false
slug: published
summary: Public summary
---
Public body`;

test("sync replaces stale content with published source articles only", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "simweb-sync-"));
  const source = path.join(directory, "source");
  const target = path.join(directory, "target");
  try {
    mkdirSync(path.join(source, "Go"), { recursive: true });
    mkdirSync(target);
    writeFileSync(path.join(source, "Go", "published.md"), published);
    writeFileSync(
      path.join(source, "Go", "draft.md"),
      published.replace("draft: false", "draft: true"),
    );
    writeFileSync(path.join(target, "obsolete.md"), "old");
    assert.equal(syncWriting(source, target), 1);
    assert.equal(existsSync(path.join(target, "obsolete.md")), false);
    assert.equal(existsSync(path.join(target, "Go", "draft.md")), false);
    assert.equal(
      readFileSync(path.join(target, "Go", "published.md"), "utf8"),
      published,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("invalid source leaves the current published content untouched", () => {
  const directory = mkdtempSync(path.join(tmpdir(), "simweb-sync-"));
  const source = path.join(directory, "source");
  const target = path.join(directory, "target");
  try {
    mkdirSync(source);
    mkdirSync(target);
    writeFileSync(
      path.join(source, "invalid.md"),
      published.replace("type: notes", ""),
    );
    writeFileSync(path.join(target, "current.md"), "current content");
    assert.throws(() => syncWriting(source, target), /type must be/);
    assert.equal(
      readFileSync(path.join(target, "current.md"), "utf8"),
      "current content",
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
