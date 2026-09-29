import assert from "node:assert/strict";
import { test } from "node:test";
import {
  browseDirectory,
  directoryFacets,
  directoryHref,
  paginateDirectory,
  readDirectoryQuery,
  type DirectoryQuery,
} from "./directory";
import type { ArticleSummary } from "./types";

function article(
  id: string,
  fields: Partial<ArticleSummary> = {},
): ArticleSummary {
  return {
    id,
    slug: id,
    kind: "notes",
    title: id,
    summary: "An article summary",
    date: "2026-09-01T00:00:00.000Z",
    categories: [],
    tags: [],
    href: `/notes/${id}`,
    ...fields,
  };
}

const all: DirectoryQuery = { q: "", page: 1 };

test("Thoughts only accepts page and browses all articles in date order", () => {
  const query = { q: "missing", category: "Other", tag: "unknown", page: 2 };
  const entries = Array.from({ length: 23 }, (_, index) =>
    article(`thought-${String(index).padStart(2, "0")}`, { kind: "thoughts" }),
  );
  assert.deepEqual(
    readDirectoryQuery(
      "thoughts",
      new URLSearchParams("q=missing&category=Other&tag=unknown&page=2"),
    ),
    { q: "", page: 2 },
  );
  assert.equal(directoryHref("thoughts", query), "/thoughts?page=2");
  const result = browseDirectory(entries, "thoughts", query);
  assert.deepEqual(result.query, { q: "", page: 2 });
  assert.deepEqual(result.items, entries.slice(10, 20));
  assert.equal(result.total, 23);
  assert.equal(result.order, "date");
});

test("directory URLs round-trip metadata verbatim and omit defaults", () => {
  const query = {
    q: "  RPC 请求  ",
    category: "Distributed Systems",
    tag: "上下文 / RAG",
    page: 2,
  };
  const href = directoryHref("notes", query);
  assert.equal(
    href,
    "/notes?q=RPC+%E8%AF%B7%E6%B1%82&category=Distributed+Systems&tag=%E4%B8%8A%E4%B8%8B%E6%96%87+%2F+RAG&page=2",
  );
  assert.deepEqual(
    readDirectoryQuery(
      "notes",
      new URL(href, "https://example.test").searchParams,
    ),
    { ...query, q: "RPC 请求" },
  );
  assert.equal(directoryHref("thoughts", all), "/thoughts");
  assert.equal(
    directoryHref("notes", { q: "  ", category: "", tag: "", page: 0 }),
    "/notes",
  );
  assert.deepEqual(
    readDirectoryQuery("notes", new URLSearchParams("category=+Agent+&tag=Go")),
    { q: "", category: " Agent ", tag: "Go", page: 1 },
  );
});

test("URL decoding takes first values and rejects invalid page representations", () => {
  assert.deepEqual(
    readDirectoryQuery(
      "notes",
      new URLSearchParams(
        "q=first&q=second&category=Agent&category=Go&tag=rag&tag=memory&page=2&page=3&sort=date",
      ),
    ),
    { q: "first", category: "Agent", tag: "rag", page: 2 },
  );
  for (const page of [
    "",
    "0",
    "-1",
    "1.5",
    "2.0",
    "1e2",
    "Infinity",
    " 2",
    "9007199254740992",
  ]) {
    assert.equal(
      readDirectoryQuery("notes", new URLSearchParams({ page })).page,
      1,
      `invalid page ${JSON.stringify(page)}`,
    );
  }
  assert.equal(
    readDirectoryQuery("notes", new URLSearchParams({ page: "002" })).page,
    2,
  );
});

test("browsing intersects kind, category and tag before ordering and pagination", () => {
  const articles = [
    article("go-only", { categories: ["Go"], tags: ["rag"] }),
    article("agent-only", { categories: ["Agent"], tags: ["memory"] }),
    article("agent-thought", {
      kind: "thoughts",
      categories: ["Agent"],
      tags: ["rag"],
    }),
    article("z-match", { categories: ["Agent", "Go"], tags: ["rag"] }),
    article("a-match", { categories: ["Agent"], tags: ["rag", "memory"] }),
    article("newest-match", {
      categories: ["Agent"],
      tags: ["rag"],
      date: "2026-09-02T00:00:00.000Z",
    }),
  ];
  const before = articles.map(({ id }) => id);
  const page = browseDirectory(articles, "notes", {
    ...all,
    category: "Agent",
    tag: "rag",
  });
  assert.deepEqual(
    page.items.map(({ id }) => id),
    ["newest-match", "a-match", "z-match"],
  );
  assert.equal(page.total, 3);
  assert.equal(page.order, "date");
  assert.deepEqual(
    articles.map(({ id }) => id),
    before,
  );
});

test("facets count each article once per value and never invent missing metadata", () => {
  const articles = [
    article("one", { categories: ["Go", "Agent", "Go"], tags: ["rag", "rag"] }),
    article("two", { categories: ["Agent"], tags: ["memory", "rag"] }),
    article("unclassified"),
    article("thought", {
      kind: "thoughts",
      categories: ["Other"],
      tags: ["thoughts-only"],
    }),
  ];
  assert.deepEqual(directoryFacets(articles, "notes"), {
    categories: [
      { value: "Agent", count: 2 },
      { value: "Go", count: 1 },
    ],
    tags: [
      { value: "memory", count: 1 },
      { value: "rag", count: 2 },
    ],
  });
  assert.equal(browseDirectory(articles, "notes", all).total, 3);
});

test("unknown metadata remains selected and produces an empty page", () => {
  const articles = [article("one", { categories: ["Agent"], tags: ["rag"] })];
  for (const filter of [{ category: "agent" }, { tag: "unknown" }]) {
    const query = { ...all, ...filter, page: 12 };
    const result = browseDirectory(articles, "notes", query);
    assert.deepEqual(result, {
      query: { ...query, page: 1 },
      items: [],
      total: 0,
      pageCount: 0,
      order: "date",
    });
  }
});

test("ordinary browsing uses fixed ten-article pages and clamps overflow", () => {
  const articles = Array.from({ length: 23 }, (_, index) =>
    article(`note-${String(index + 1).padStart(2, "0")}`),
  );
  const first = browseDirectory(articles, "notes", all);
  const second = browseDirectory(articles, "notes", { ...all, page: 2 });
  const last = browseDirectory(articles, "notes", { ...all, page: 500 });
  assert.equal(first.items.length, 10);
  assert.deepEqual(
    second.items.map(({ id }) => id),
    articles.slice(10, 20).map(({ id }) => id),
  );
  assert.equal(second.total, 23);
  assert.equal(second.pageCount, 3);
  assert.deepEqual(last.items, articles.slice(20));
  assert.equal(last.query.page, 3);
});

test("search handles use the same pagination without changing relevance order", () => {
  const handles = Array.from({ length: 11 }, (_, index) => ({
    id: `rank-${11 - index}`,
  }));
  const query = { q: "  RPC  ", tag: "Go", page: 2 };
  const page = paginateDirectory(handles, query);
  assert.deepEqual(page, {
    query: { ...query, q: "RPC" },
    items: [handles[10]],
    total: 11,
    pageCount: 2,
  });
  assert.equal(paginateDirectory(handles.slice(0, 10), all).pageCount, 1);
  assert.deepEqual(paginateDirectory([], { ...query, page: 12 }), {
    query: { ...query, q: "RPC", page: 1 },
    items: [],
    total: 0,
    pageCount: 0,
  });
  assert.equal(paginateDirectory(handles, { ...all, page: NaN }).query.page, 1);
});

test("ordinary browsing cannot silently substitute for keyword search", () => {
  assert.throws(
    () => browseDirectory([article("one")], "notes", { ...all, q: "RPC" }),
    /Keyword searches require/,
  );
  assert.equal(
    browseDirectory([article("one")], "notes", { ...all, q: "  " }).total,
    1,
  );
});
