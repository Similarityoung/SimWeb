import assert from "node:assert/strict";
import test from "node:test";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { createConversation, exchanges, shortRequest } from "./conversation";
import {
  answerRequestSchema,
  type Answer,
  type AnswerMessage,
  type AnswerRequest,
} from "@/lib/answer/schema";
import type { PublicCatalog } from "./types";

const catalog: PublicCatalog = {
  projects: [
    {
      id: "simweb",
      title: "SimWeb",
      summary: "Site",
      role: "Owner",
      tags: [],
      icon: "globe",
    },
  ],
  articles: [],
};
const answer: Answer = {
  kind: "answer",
  text: '你好，"quoted"\n第二行。',
  references: [{ type: "project", id: "simweb" }],
};
const question = { type: "text" as const, text: "hello" };
const message = {
  role: "user" as const,
  parts: [{ type: "text" as const, text: question.text }],
  metadata: { question },
};
const response = (value: Answer, finish = true) =>
  createUIMessageStreamResponse({
    stream: createUIMessageStream<AnswerMessage>({
      execute: ({ writer }) => {
        writer.write({ type: "start" });
        writer.write({
          type: "data-answer",
          id: "answer",
          data: { status: "streaming", text: "你好" },
        });
        writer.write({
          type: "data-answer",
          id: "answer",
          data: { status: "complete", answer: value },
        });
        if (finish) {
          writer.write({ type: "finish", finishReason: "stop" });
          writer.setOutcome({ status: "completed" });
        }
      },
    }),
  });

test("Chat consumes SDK UI protocol, retains transcript but sends only the bounded successful history", async () => {
  const requests: AnswerRequest[] = [];
  const chat = createConversation(catalog, async (_url, init) => {
    requests.push(answerRequestSchema.parse(JSON.parse(String(init?.body))));
    return response(
      requests.length === 1 ? answer : { ...answer, references: [] },
    );
  });
  for (const text of ["hello", "more", "again"])
    await chat.sendMessage({
      ...message,
      metadata: { question: { type: "text", text } },
    });
  assert.equal(chat.messages.length, 6);
  assert.ok(exchanges(chat.messages).every((m) => m.complete));
  assert.deepEqual(requests[2].previous, {
    question: "more",
    text: answer.text,
  });
  assert.deepEqual(requests[2].lastShownReferences, answer.references);
  assert.ok(!JSON.stringify(requests[2]).includes('"hello"'));
});

for (const [label, fetcher] of [
  ["complete without finish", async () => response(answer, false)],
  [
    "unknown catalog ref",
    async () =>
      response({ ...answer, references: [{ type: "article", id: "missing" }] }),
  ],
  ["HTTP 429", async () => new Response("private", { status: 429 })],
] as const)
  test(`incomplete client messages cannot show cards or enter history: ${label}`, async () => {
    const chat = createConversation(catalog, fetcher);
    await chat.sendMessage(message);
    const exchange = exchanges(chat.messages)[0];
    assert.equal(exchange.complete, false);
    assert.equal(exchange.answer, undefined);
    assert.ok(exchange.error);
    assert.equal(shortRequest(chat.messages).previous, undefined);
  });

test("clearing into a new Chat isolates late callbacks from a cancelled session", async () => {
  let finish!: () => void;
  const old = createConversation(catalog, async () =>
    createUIMessageStreamResponse({
      stream: createUIMessageStream<AnswerMessage>({
        execute: async ({ writer }) => {
          writer.write({ type: "start" });
          writer.write({
            type: "data-answer",
            id: "answer",
            data: { status: "streaming", text: "Old" },
          });
          await new Promise<void>((resolve) => {
            finish = resolve;
          });
          writer.write({
            type: "data-answer",
            id: "answer",
            data: { status: "complete", answer },
          });
          writer.write({ type: "finish", finishReason: "stop" });
        },
      }),
    }),
  );
  const sending = old.sendMessage(message);
  while (!finish) await new Promise((resolve) => setImmediate(resolve));
  await old.stop();
  const fresh = createConversation(catalog, async () => response(answer));
  await fresh.sendMessage(message);
  finish();
  await sending;
  assert.equal(exchanges(fresh.messages).length, 1);
  assert.equal(exchanges(fresh.messages)[0].complete, true);
  assert.equal(exchanges(old.messages)[0].complete, false);
});
