import assert from "node:assert/strict";
import test from "node:test";
import { GET, POST } from "./route";
import {
  ACCESS_COOKIE,
  issueAccessPass,
} from "@/lib/answer/access-pass.server";

const request = (headers: Record<string, string> = {}) =>
  new Request("https://www.simi.host/api/answer/access", {
    method: "POST",
    headers: { ...headers },
  });

function enabled() {
  const oldEnabled = process.env.DEEPSEEK_PUBLIC_ENABLED;
  const oldKey = process.env.DEEPSEEK_API_KEY;
  const oldSecret = process.env.TURNSTILE_SECRET_KEY;
  process.env.DEEPSEEK_PUBLIC_ENABLED = "true";
  process.env.DEEPSEEK_API_KEY = "test-only";
  process.env.TURNSTILE_SECRET_KEY = "test-secret";
  return () => {
    for (const [name, value] of [
      ["DEEPSEEK_PUBLIC_ENABLED", oldEnabled],
      ["DEEPSEEK_API_KEY", oldKey],
      ["TURNSTILE_SECRET_KEY", oldSecret],
    ] as const) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  };
}

test("access check accepts a valid pass, rejects missing or forged credentials and never renews it", (t) => {
  const restore = enabled();
  t.after(restore);
  const missing = new Request("https://www.simi.host/api/answer/access");
  assert.equal(GET(missing).status, 401);
  const pass = issueAccessPass("www.simi.host")!;
  const valid = new Request("https://www.simi.host/api/answer/access", {
    headers: { Cookie: `${ACCESS_COOKIE}=${pass}` },
  });
  assert.equal(GET(valid).status, 204);
  const forged = new Request("https://www.simi.host/api/answer/access", {
    headers: { Cookie: `${ACCESS_COOKIE}=forged` },
  });
  assert.equal(GET(forged).status, 401);
  assert.equal(GET(valid).headers.get("set-cookie"), null);
  assert.equal(GET(valid).headers.get("cache-control"), "no-store");
});

test("handshake fails closed on origin, missing token, invalid token and unavailable Siteverify", async (t) => {
  const restore = enabled();
  t.after(restore);
  const network = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ success: false, "error-codes": ["timeout-or-duplicate"] }),
  );
  assert.equal(
    (await POST(request({ Origin: "https://evil.example" }))).status,
    403,
  );
  assert.equal((await POST(request())).status, 403);
  assert.equal(
    (await POST(request({ "x-turnstile-token": "spent" }))).status,
    403,
  );
  assert.equal(network.mock.callCount(), 1);
  network.mock.mockImplementation(async () => {
    throw new Error("network down");
  });
  assert.equal(
    (await POST(request({ "x-turnstile-token": "token" }))).status,
    503,
  );
});

test("successful handshake validates once and sets fixed secure HttpOnly cookie", async (t) => {
  const restore = enabled();
  t.after(restore);
  const network = t.mock.method(
    globalThis,
    "fetch",
    async (_url: RequestInfo | URL, init?: RequestInit) => {
      assert.equal(
        (init?.body as URLSearchParams).get("response"),
        "turnstile-once",
      );
      return Response.json({
        success: true,
        hostname: "www.simi.host",
        action: "answer",
      });
    },
  );
  const response = await POST(
    request({
      Origin: "https://www.simi.host",
      "x-turnstile-token": "turnstile-once",
    }),
  );
  assert.equal(response.status, 204);
  assert.match(response.headers.get("set-cookie") ?? "", /HttpOnly/);
  assert.match(response.headers.get("set-cookie") ?? "", /SameSite=Lax/);
  assert.match(response.headers.get("set-cookie") ?? "", /Secure/);
  assert.equal(network.mock.callCount(), 1);
});
