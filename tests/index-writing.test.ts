import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import { indexWriting } from "../scripts/index-writing";

type SearchModule = {
  options(options: { basePath: string; baseUrl: string }): Promise<void>;
  search(
    query: string,
    options?: { filters: Record<string, string> },
  ): Promise<{
    results: {
      data(): Promise<{
        url: string;
        content: string;
        meta: Record<string, string>;
      }>;
    }[];
  }>;
  destroy(): Promise<void>;
};

function article(slug: string, kind = "notes", body = "quasarbodyneedle") {
  return `---
title: ${slug}
type: ${kind}
date: 2026-09-29
draft: false
slug: ${slug}
summary: Published summary
categories: [backendmarker]
tags: [memorymarker]
---
${body}`;
}

test("the real index searches published bodies and metadata, filters, and replaces stale files", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "simweb-index-"));
  const source = path.join(directory, "content");
  const output = path.join(directory, "pagefind");
  const server = createServer(async (request, response) => {
    try {
      const name = new URL(request.url!, "http://localhost").pathname.replace(
        /^\/pagefind\//,
        "",
      );
      response.end(await readFile(path.join(output, name)));
    } catch {
      response.writeHead(404).end();
    }
  });
  let search: SearchModule | undefined;
  try {
    await mkdir(source);
    await mkdir(output);
    await writeFile(path.join(directory, "package.json"), '{"type":"module"}');
    await writeFile(path.join(source, "note.md"), article("published-note"));
    await writeFile(
      path.join(source, "thought.md"),
      article("published-thought", "thoughts"),
    );
    await writeFile(
      path.join(source, "draft.md"),
      article("draft-note", "notes", "draftonlyneedle").replace(
        "draft: false",
        "draft: true",
      ),
    );
    await writeFile(path.join(output, "obsolete.pf_fragment"), "old index");

    assert.equal(await indexWriting(source, output), 2);
    await assert.rejects(readFile(path.join(output, "obsolete.pf_fragment")));
    const entry = JSON.parse(
      await readFile(path.join(output, "pagefind-entry.json"), "utf8"),
    );
    assert.deepEqual(Object.keys(entry.languages), ["zh"]);
    assert.equal(entry.languages.zh.page_count, 2);

    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    search = await import(pathToFileURL(path.join(output, "pagefind.js")).href);
    assert.ok(search);
    await search.options({
      basePath: `http://127.0.0.1:${address.port}/pagefind/`,
      baseUrl: "/",
    });

    assert.equal((await search.search("quasarbodyneedle")).results.length, 2);
    const filtered = await search.search("quasarbodyneedle", {
      filters: {
        kind: "notes",
        category: "backendmarker",
        tag: "memorymarker",
      },
    });
    assert.equal(filtered.results.length, 1);
    const data = await filtered.results[0].data();
    assert.equal(data.meta.articleId, "published-note");
    assert.equal(data.url, "/notes/published-note");
    assert.match(data.content, /quasarbodyneedle/);
    assert.equal((await search.search("memorymarker")).results.length, 2);
    assert.equal((await search.search("backendmarker")).results.length, 2);
    assert.equal((await search.search("draftonlyneedle")).results.length, 0);
  } finally {
    await search?.destroy();
    server.closeAllConnections();
    if (server.listening) {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
    await rm(directory, { recursive: true, force: true });
  }
});

test("invalid publication metadata fails without replacing the index", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "simweb-index-"));
  const source = path.join(directory, "content");
  const output = path.join(directory, "pagefind");
  try {
    await mkdir(source);
    await mkdir(output);
    await writeFile(path.join(output, "existing.txt"), "current index");
    await writeFile(
      path.join(source, "invalid.md"),
      article("invalid").replace("type: notes\n", ""),
    );
    await assert.rejects(indexWriting(source, output), /type must be/);
    assert.equal(
      await readFile(path.join(output, "existing.txt"), "utf8"),
      "current index",
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
