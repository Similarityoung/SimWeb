import assert from "node:assert/strict";
import { test } from "node:test";
import {
  articleAnchor,
  articleHref,
  articleReturnTarget,
} from "./reading-location";
import type { DirectoryQuery } from "./directory";

const article = { kind: "notes", href: "/notes/rpc-example" } as const;

test("directory reading round-trips filters, query and page to the article anchor", () => {
  const query: DirectoryQuery = {
    q: " RPC 请求 ",
    category: "Distributed Systems",
    tag: "Go & 内存",
    page: 2,
  };
  const href = articleHref(article, { type: "directory", query });
  const url = new URL(href, "https://example.test");
  assert.equal(url.pathname, article.href);
  assert.equal(url.searchParams.get("from"), "directory");
  assert.equal(url.searchParams.get("q"), "RPC 请求");
  assert.equal(url.searchParams.get("category"), query.category);
  assert.equal(url.searchParams.get("tag"), query.tag);
  const target = articleReturnTarget({
    kind: "notes",
    articleId: "rpc-example",
    params: url.searchParams,
    hasConversation: true,
  });
  const returned = new URL(target.href, "https://example.test");
  assert.equal(returned.pathname, "/notes");
  assert.equal(returned.searchParams.get("q"), "RPC 请求");
  assert.equal(returned.searchParams.get("category"), query.category);
  assert.equal(returned.searchParams.get("tag"), query.tag);
  assert.equal(returned.searchParams.get("page"), "2");
  assert.equal(returned.hash, `#${articleAnchor("rpc-example")}`);
  assert.equal(returned.searchParams.has("from"), false);
  assert.equal(target.label, "Back to Notes");
});

test("default directory reading omits empty parameters and retains the article target", () => {
  const thought = { kind: "thoughts", href: "/thoughts/harness" } as const;
  const href = articleHref(thought, {
    type: "directory",
    query: { q: "", page: 1 },
  });
  assert.equal(href, "/thoughts/harness?from=directory");
  assert.deepEqual(
    articleReturnTarget({
      kind: "thoughts",
      articleId: "harness",
      params: new URL(href, "https://example.test").searchParams,
      hasConversation: false,
    }),
    { href: "/thoughts#article-harness", label: "Back to Thoughts" },
  );
});

test("conversation return needs a live conversation and ignores directory parameters", () => {
  assert.equal(
    articleHref(article, { type: "conversation" }),
    "/notes/rpc-example?from=conversation",
  );
  const input = {
    kind: "notes",
    articleId: "rpc-example",
    params: new URLSearchParams("from=conversation&q=RPC&page=2"),
  } as const;
  assert.deepEqual(articleReturnTarget({ ...input, hasConversation: true }), {
    href: "/",
    label: "Back to conversation",
  });
  assert.deepEqual(articleReturnTarget({ ...input, hasConversation: false }), {
    href: "/notes",
    label: "All notes",
  });
});

test("Thoughts reading retains page and anchor without search or metadata filters", () => {
  const thought = { kind: "thoughts", href: "/thoughts/harness" } as const;
  assert.equal(
    articleHref(thought, {
      type: "directory",
      query: { q: "ignored", category: "Agent", tag: "mcp", page: 2 },
    }),
    "/thoughts/harness?from=directory&page=2",
  );
  assert.deepEqual(
    articleReturnTarget({
      kind: "thoughts",
      articleId: "harness",
      params: new URLSearchParams(
        "from=directory&q=ignored&category=Agent&tag=mcp&page=2",
      ),
      hasConversation: false,
    }),
    { href: "/thoughts?page=2#article-harness", label: "Back to Thoughts" },
  );
});

test("direct and invalid sources always return to the article's own full directory", () => {
  assert.equal(articleHref(article), article.href);
  for (const search of [
    "",
    "q=RPC&page=2",
    "from=unknown&q=RPC&page=2",
    "from=https%3A%2F%2Fother.test&returnTo=https%3A%2F%2Fother.test",
  ]) {
    assert.deepEqual(
      articleReturnTarget({
        kind: "notes",
        articleId: "rpc-example",
        params: new URLSearchParams(search),
        hasConversation: true,
      }),
      { href: "/notes", label: "All notes" },
    );
  }
});

test("directory return accepts only known fields and normalizes malformed pages", () => {
  const params = new URLSearchParams(
    "from=directory&from=conversation&q=+RPC+&category=Unknown&page=-3&returnTo=https%3A%2F%2Fother.test&kind=thoughts&articleId=other",
  );
  assert.deepEqual(
    articleReturnTarget({
      kind: "notes",
      articleId: "rpc-example",
      params: { get: (name) => params.get(name) },
      hasConversation: true,
    }),
    {
      href: "/notes?q=RPC&category=Unknown#article-rpc-example",
      label: "Back to Notes",
    },
  );
});
