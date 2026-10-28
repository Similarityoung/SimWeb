import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "./route";
import {
  ACCESS_COOKIE,
  issueAccessPass,
} from "@/lib/answer/access-pass.server";

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

test("streamed body size and withdrawn references are checked before any model request", async (t) => {
  const oldSecret = process.env.TURNSTILE_SECRET_KEY;
  process.env.TURNSTILE_SECRET_KEY = "test-only";
  t.after(() => {
    if (oldSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = oldSecret;
  });
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ success: true, hostname: "example.com", action: "answer" }),
  );
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
    const invalidContext = await POST(
      new Request("https://example.com/api/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${ACCESS_COOKIE}=${issueAccessPass("example.com")}`,
        },
        body: JSON.stringify({
          question: { type: "text", text: "tell me more" },
          lastShownReferences: [{ type: "article", id: "withdrawn" }],
        }),
      }),
    );
    assert.equal(invalidContext.status, 400);
  } finally {
    if (previousKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = previousKey;
    if (previousEnabled === undefined)
      delete process.env.DEEPSEEK_PUBLIC_ENABLED;
    else process.env.DEEPSEEK_PUBLIC_ENABLED = previousEnabled;
  }
});

test("answer endpoint rejects missing or forged passes and token-only requests without calling the model", async (t) => {
  const { enable, restore } = enableAi();
  enable();
  const oldSecret = process.env.TURNSTILE_SECRET_KEY;
  process.env.TURNSTILE_SECRET_KEY = "test-secret";
  t.after(() => {
    if (oldSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = oldSecret;
  });
  const network = t.mock.method(globalThis, "fetch", () => {
    throw new Error("Must not call the model");
  });
  try {
    const body = {
      question: { type: "text", text: "hello" },
      lastShownReferences: [],
    };
    const missing = await POST(
      makeRequest({
        ...body,
      }),
    );
    const forged = await POST(
      makeRequest(body, { cookie: `${ACCESS_COOKIE}=forged` }),
    );
    assert.equal(missing.status, 403);
    assert.equal(forged.status, 403);
    assert.equal(
      (
        await POST(
          makeRequest(body, {
            "x-turnstile-token": "a-token-is-not-an-access-pass",
          }),
        )
      ).status,
      403,
    );
    assert.equal(network.mock.callCount(), 0);
  } finally {
    restore();
  }
});

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://www.simi.host/api/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}
function enableAi() {
  const key = process.env.DEEPSEEK_API_KEY;
  const enabled = process.env.DEEPSEEK_PUBLIC_ENABLED;
  return {
    enable() {
      process.env.DEEPSEEK_API_KEY = "test-only";
      process.env.DEEPSEEK_PUBLIC_ENABLED = "true";
    },
    restore() {
      if (key === undefined) delete process.env.DEEPSEEK_API_KEY;
      else process.env.DEEPSEEK_API_KEY = key;
      if (enabled === undefined) delete process.env.DEEPSEEK_PUBLIC_ENABLED;
      else process.env.DEEPSEEK_PUBLIC_ENABLED = enabled;
    },
  };
}
