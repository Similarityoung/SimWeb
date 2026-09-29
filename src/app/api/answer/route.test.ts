import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "./route";

test("the public model endpoint is closed unless explicitly enabled", async () => {
  const previousEnabled = process.env.DEEPSEEK_PUBLIC_ENABLED;
  delete process.env.DEEPSEEK_PUBLIC_ENABLED;
  try {
    const response = await POST(
      new Request("https://example.com/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: { type: "text", text: "Redis" },
          lastShownReferences: [],
        }),
      }),
    );
    assert.equal(response.status, 503);
  } finally {
    if (previousEnabled !== undefined)
      process.env.DEEPSEEK_PUBLIC_ENABLED = previousEnabled;
  }
});

test("the endpoint rejects cross-origin and oversized requests before retrieval", async () => {
  const previousKey = process.env.DEEPSEEK_API_KEY;
  const previousEnabled = process.env.DEEPSEEK_PUBLIC_ENABLED;
  process.env.DEEPSEEK_API_KEY = "test-only";
  process.env.DEEPSEEK_PUBLIC_ENABLED = "true";
  try {
    const crossOrigin = await POST(
      new Request("https://example.com/api/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://other.example",
        },
        body: JSON.stringify({
          question: { type: "text", text: "Redis" },
          lastShownReferences: [],
        }),
      }),
    );
    assert.equal(crossOrigin.status, 403);
    for (const text of ["x".repeat(3000), null, 3, " \n", "x".repeat(301)]) {
      const invalid = await POST(
        new Request("https://example.com/api/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: { type: "text", text },
            lastShownReferences: [],
          }),
        }),
      );
      assert.equal(invalid.status, 400);
    }
  } finally {
    if (previousKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = previousKey;
    if (previousEnabled === undefined)
      delete process.env.DEEPSEEK_PUBLIC_ENABLED;
    else process.env.DEEPSEEK_PUBLIC_ENABLED = previousEnabled;
  }
});

test("streamed body size and short history are checked before any model request", async () => {
  const previousKey = process.env.DEEPSEEK_API_KEY;
  const previousEnabled = process.env.DEEPSEEK_PUBLIC_ENABLED;
  process.env.DEEPSEEK_API_KEY = "test-only";
  process.env.DEEPSEEK_PUBLIC_ENABLED = "true";
  try {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode('{"question":{"type":"text","text":"'),
        );
        controller.enqueue(new TextEncoder().encode("x".repeat(20_000)));
        controller.close();
      },
    });
    const oversized = new Request("https://example.com/api/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": "10" },
      body,
      duplex: "half",
    } as RequestInit);
    assert.equal((await POST(oversized)).status, 400);
    for (const request of [
      {
        question: { type: "topic", topic: "notes", text: "weather" },
        lastShownReferences: [],
      },
      {
        question: { type: "text", text: "tell me more" },
        lastShownReferences: [{ type: "article", id: "withdrawn" }],
      },
      {
        question: { type: "text", text: "hi" },
        lastShownReferences: [],
        previous: { question: "old", text: "x".repeat(1201) },
      },
    ]) {
      assert.equal(
        (
          await POST(
            new Request("https://example.com/api/answer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(request),
            }),
          )
        ).status,
        400,
      );
    }
  } finally {
    if (previousKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = previousKey;
    if (previousEnabled === undefined)
      delete process.env.DEEPSEEK_PUBLIC_ENABLED;
    else process.env.DEEPSEEK_PUBLIC_ENABLED = previousEnabled;
  }
});
