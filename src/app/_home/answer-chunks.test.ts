import assert from "node:assert/strict";
import { test } from "node:test";
import { createAnswerChunks } from "./answer-chunks";

test("presentation chunks preserve original text, whitespace and Unicode", () => {
  for (const text of [
    "",
    "I work mainly in Go, around RPC and distributed systems.",
    "  中文笔记与 English words。\n\n下一段\t保持空白。  ",
    "👨‍👩‍👧‍👦 Café e\u0301 <script>literal text</script>",
  ]) {
    const chunks = createAnswerChunks(text);
    assert.equal(chunks.map((chunk) => chunk.content).join(""), text);
    assert.ok(chunks.every((chunk) => chunk.content && chunk.delayMs > 0));
  }
});
