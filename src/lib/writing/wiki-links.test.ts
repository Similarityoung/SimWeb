import assert from "node:assert/strict";
import { test } from "node:test";
import { fromMarkdown } from "mdast-util-from-markdown";
import { visit } from "unist-util-visit";
import { remarkWikiLinks } from "./wiki-links";

const targets = {
  "Agent/上下文工程": "/notes/agent-context-engineering",
  "Dubbo/泛化调用": "/notes/dubbo-generic-invoke",
};

function parse(source: string) {
  const tree = fromMarkdown(source);
  remarkWikiLinks(targets)(tree);
  return tree;
}

test("published wiki links use article routes and optional display text", () => {
  const tree = parse(
    "见 [[Agent/上下文工程]] 和 [[Dubbo/泛化调用|调用链路]]。",
  );
  const links: [string, string][] = [];
  visit(tree, "link", (node) => {
    const label = node.children[0];
    assert.equal(label.type, "text");
    links.push([node.url, label.value]);
  });
  assert.deepEqual(links, [
    ["/notes/agent-context-engineering", "上下文工程"],
    ["/notes/dubbo-generic-invoke", "调用链路"],
  ]);
});

test("code examples remain literal and missing published targets fail", () => {
  const tree = parse("`[[Missing]]`\n\n```md\n[[Missing]]\n```");
  const code: string[] = [];
  visit(tree, "inlineCode", (node) => code.push(node.value));
  visit(tree, "code", (node) => code.push(node.value));
  assert.deepEqual(code, ["[[Missing]]", "[[Missing]]"]);
  assert.throws(
    () => parse("见 [[Missing]]"),
    /Unpublished wiki link target: Missing/,
  );
});
