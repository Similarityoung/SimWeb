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
        body: JSON.stringify({ text: "Redis" }),
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
        body: JSON.stringify({ text: "Redis" }),
      }),
    );
    assert.equal(crossOrigin.status, 403);
    const oversized = await POST(
      new Request("https://example.com/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "x".repeat(3000) }),
      }),
    );
    assert.equal(oversized.status, 400);
  } finally {
    if (previousKey === undefined) delete process.env.DEEPSEEK_API_KEY;
    else process.env.DEEPSEEK_API_KEY = previousKey;
    if (previousEnabled === undefined)
      delete process.env.DEEPSEEK_PUBLIC_ENABLED;
    else process.env.DEEPSEEK_PUBLIC_ENABLED = previousEnabled;
  }
});
