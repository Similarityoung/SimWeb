import assert from "node:assert/strict";
import { test } from "node:test";
import { fromMarkdown } from "mdast-util-from-markdown";
import { visit } from "unist-util-visit";
import { readPublishedArticles } from "./catalog";
import { renderMermaid } from "./mermaid";

test("Pele renders a diagram to SVG with a unique accessibility ID prefix", () => {
  const result = renderMermaid(
    "flowchart LR\n  accTitle: Input and output\n  A[Input] --> B[Output]",
    "test-chart",
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.svg.includes("<svg"));
  assert.ok(result.svg.includes('id="test-chart-title"'));
  assert.ok(!result.svg.includes("max-width:100%"));
});

test("invalid Mermaid returns a rendering error", () => {
  const result = renderMermaid("not a diagram", "invalid-chart");
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /No diagram type detected/);
});

test("all published Mermaid fences render successfully", () => {
  let count = 0;
  for (const { file, article } of readPublishedArticles("content")) {
    const tree = fromMarkdown(article.body);
    visit(tree, "code", (node) => {
      if (node.lang?.trim().toLowerCase() !== "mermaid") return;
      count += 1;
      const result = renderMermaid(
        node.value,
        `${article.id}-mermaid-${count}`,
      );
      assert.equal(
        result.ok,
        true,
        `${file} contains an invalid Mermaid diagram`,
      );
    });
  }
  assert.ok(count > 0, "expected published content to include Mermaid fences");
});
