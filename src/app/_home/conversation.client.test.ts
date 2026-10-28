import assert from "node:assert/strict";
import test from "node:test";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { createConversation, exchanges, shortRequest } from "./conversation";
import {
  answerRequestSchema,
  answerErrors,
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
const authorized =
  (fetcher: typeof fetch): typeof fetch =>
  async (url, init) =>
    String(url).endsWith("/api/answer/access")
      ? new Response(null, { status: 204 })
      : fetcher(url, init);

test("Chat consumes SDK UI protocol, retains transcript but sends only the bounded successful history", async () => {
  const requests: AnswerRequest[] = [];
  const chat = createConversation(
    catalog,
    async () => "test-token",
    authorized(async (_url, init) => {
      requests.push(answerRequestSchema.parse(JSON.parse(String(init?.body))));
      return response(
        requests.length === 1 ? answer : { ...answer, references: [] },
      );
    }),
  );
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
    const chat = createConversation(
      catalog,
      async () => "test-token",
      authorized(fetcher),
    );
    await chat.sendMessage(message);
    const exchange = exchanges(chat.messages)[0];
    assert.equal(exchange.complete, false);
    assert.equal(exchange.answer, undefined);
    assert.ok(exchange.error);
    assert.equal(shortRequest(chat.messages).previous, undefined);
  });

test("clearing into a new Chat isolates late callbacks from a cancelled session", async () => {
  let finish!: () => void;
  const old = createConversation(
    catalog,
    async () => "test-token",
    authorized(async () =>
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
    ),
  );
  const sending = old.sendMessage(message);
  while (!finish) await new Promise((resolve) => setImmediate(resolve));
  await old.stop();
  const fresh = createConversation(
    catalog,
    async () => "test-token",
    authorized(async () => response(answer)),
  );
  await fresh.sendMessage(message);
  finish();
  await sending;
  assert.equal(exchanges(fresh.messages).length, 1);
  assert.equal(exchanges(fresh.messages)[0].complete, true);
  assert.equal(exchanges(old.messages)[0].complete, false);
});

test("first submission performs one isolated Turnstile handshake before one answer request", async () => {
  let qualified = false;
  const calls: string[] = [];
  const chat = createConversation(
    catalog,
    async () => "single-use-turnstile-token",
    async (url, init) => {
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (String(url).endsWith("/api/answer/access")) {
        if (init?.method === "POST") {
          assert.equal(
            new Headers(init.headers).get("x-turnstile-token"),
            "single-use-turnstile-token",
          );
          qualified = true;
          return new Response(null, { status: 204 });
        }
        return new Response(null, { status: qualified ? 204 : 401 });
      }
      assert.equal(qualified, true);
      assert.equal(new Headers(init?.headers).has("x-turnstile-token"), false);
      return response(answer);
    },
  );
  await chat.sendMessage(message);
  await chat.sendMessage({
    ...message,
    metadata: { question: { type: "text", text: "another" } },
  });
  assert.deepEqual(calls, [
    "GET /api/answer/access",
    "POST /api/answer/access",
    "POST /api/answer",
    "GET /api/answer/access",
    "POST /api/answer",
  ]);
});

test("cancelling during access qualification prevents the handshake and answer request from continuing", async () => {
  let started!: () => void;
  let access!: (response: Response) => void;
  const accessStarted = new Promise<void>((resolve) => (started = resolve));
  const accessResponse = new Promise<Response>((resolve) => (access = resolve));
  const calls: string[] = [];
  const chat = createConversation(
    catalog,
    async () => "unused-token",
    async (url) => {
      calls.push(String(url));
      started();
      return accessResponse;
    },
  );
  const sending = chat.sendMessage(message);
  await accessStarted;
  await chat.stop();
  access(new Response(null, { status: 401 }));
  await sending;
  assert.deepEqual(calls, ["/api/answer/access"]);
  assert.equal(exchanges(chat.messages)[0].complete, false);
});

for (const [stage, status, expected] of [
  ["check", 429, answerErrors.limited],
  ["check", 503, answerErrors.unavailable],
  ["handshake", 403, answerErrors.verification],
  ["handshake", 429, answerErrors.limited],
  ["handshake", 503, answerErrors.unavailable],
] as const)
  test(`access ${stage} failure ${status} never sends an answer or retries`, async () => {
    const calls: string[] = [];
    const chat = createConversation(
      catalog,
      async () => "test-token",
      async (url, init) => {
        calls.push(`${init?.method} ${url}`);
        return new Response(null, {
          status:
            stage === "handshake" && init?.method === "GET" ? 401 : status,
        });
      },
    );
    await chat.sendMessage(message);
    assert.equal(calls.length, stage === "check" ? 1 : 2);
    assert.ok(calls.every((call) => call.endsWith("/api/answer/access")));
    assert.equal(exchanges(chat.messages)[0].error, expected);
    assert.equal(chat.messages.filter((m) => m.role === "user").length, 1);
  });

test("cancelling while Turnstile is pending ignores a late token", async () => {
  let started!: () => void;
  let complete!: (token: string) => void;
  const ready = new Promise<void>((resolve) => (started = resolve));
  const token = new Promise<string>((resolve) => (complete = resolve));
  const calls: string[] = [];
  const chat = createConversation(
    catalog,
    async () => {
      started();
      return token;
    },
    async (url) => {
      calls.push(String(url));
      return new Response(null, { status: 401 });
    },
  );
  const sending = chat.sendMessage(message);
  await ready;
  await chat.stop();
  complete("late-token");
  await sending;
  assert.deepEqual(calls, ["/api/answer/access"]);
  assert.equal(exchanges(chat.messages)[0].complete, false);
});
