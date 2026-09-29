import assert from "node:assert/strict";
import test from "node:test";
import { fakeDeepSeek } from "../../../tests/answer-upstream";
import { createAnswerStream } from "./service.server";
import { answerErrors, type Answer, type AnswerRequest } from "./schema";

const request: AnswerRequest = {
  question: { type: "topic", topic: "about" },
  lastShownReferences: [],
};
const answer: Answer = {
  kind: "answer",
  text: '你好，"quoted"\n第二行。',
  references: [{ type: "project", id: "simweb" }],
};

test("real DeepSeek provider parses fragmented UTF-8 JSON into progressive SDK UI data", async () => {
  let calls = 0;
  const model = fakeDeepSeek(JSON.stringify(answer), {
    inspect(body) {
      calls++;
      assert.deepEqual(body.thinking, { type: "disabled" });
      assert.equal(body.stream, true);
      assert.deepEqual(body.response_format, { type: "json_object" });
    },
  });
  const events = [];
  for await (const event of createAnswerStream(
    request,
    new AbortController().signal,
    model,
  ))
    events.push(event);
  assert.equal(calls, 1);
  assert.equal(events[0].type, "start");
  assert.deepEqual(events.at(-1), { type: "finish", finishReason: "stop" });
  const parts = events.filter((e) => e.type === "data-answer");
  assert.ok(parts.length > 2);
  assert.equal(new Set(parts.map((p) => p.id)).size, 1);
  assert.deepEqual(parts.at(-1)?.data, { status: "complete", answer });
});

for (const [label, output, options] of [
  ["truncated valid JSON", JSON.stringify(answer), { finish: "length" }],
  ["error then valid JSON and stop", JSON.stringify(answer), { error: true }],
  [
    "bad reference",
    JSON.stringify({
      ...answer,
      references: [{ type: "article", id: "invented" }],
    }),
    {},
  ],
  ["invalid JSON", '{"text":"unfinished', {}],
  ["rate limited", "", { status: 429 }],
] as const)
  test(`failed streams never declare completion: ${label}`, async () => {
    let calls = 0;
    const model = fakeDeepSeek(output, {
      ...options,
      inspect: () => {
        calls++;
      },
    });
    const events = [];
    for await (const event of createAnswerStream(
      request,
      new AbortController().signal,
      model,
    ))
      events.push(event);
    assert.ok(
      !events.some(
        (e) =>
          e.type === "finish" ||
          (e.type === "data-answer" && e.data.status === "complete"),
      ),
    );
    assert.equal(calls, 1);
    const error = events.find((e) => e.type === "error");
    assert.ok(error);
    assert.ok(!error.errorText.includes("PRIVATE"));
    if ("status" in options)
      assert.equal(error.errorText, answerErrors.limited);
  });
