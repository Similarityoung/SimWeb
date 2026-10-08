import assert from "node:assert/strict";
import test from "node:test";
import { verifyTurnstile } from "./turnstile.server";

const request = (token = "test-token") =>
  new Request("https://www.simi.host/api/answer", {
    headers: { "x-turnstile-token": token },
  });

test("Siteverify fails closed and binds valid tokens to this hostname and action", async (t) => {
  const oldSecret = process.env.TURNSTILE_SECRET_KEY;
  process.env.TURNSTILE_SECRET_KEY = "test-only";
  t.after(() => {
    if (oldSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = oldSecret;
  });
  let result: unknown = {
    success: true,
    hostname: "www.simi.host",
    action: "answer",
  };
  const network = t.mock.method(
    globalThis,
    "fetch",
    async (_url: unknown, init?: RequestInit) => {
      assert.equal(
        (init?.body as URLSearchParams).get("response"),
        "test-token",
      );
      assert.equal((init?.body as URLSearchParams).get("secret"), "test-only");
      return Response.json(result);
    },
  );
  assert.equal(await verifyTurnstile(request()), "valid");
  for (const value of [
    { success: false, "error-codes": ["timeout-or-duplicate"] },
    { success: true, hostname: "other.example", action: "answer" },
    { success: true, hostname: "www.simi.host", action: "login" },
    { success: "true", hostname: "www.simi.host", action: "answer" },
  ]) {
    result = value;
    assert.equal(await verifyTurnstile(request()), "invalid");
  }
  result = null;
  assert.equal(await verifyTurnstile(request()), "unavailable");
  network.mock.mockImplementation(async () => {
    throw new Error("Network unavailable");
  });
  assert.equal(await verifyTurnstile(request()), "unavailable");
  const calls = network.mock.callCount();
  assert.equal(await verifyTurnstile(request("")), "invalid");
  assert.equal(await verifyTurnstile(request("x".repeat(2049))), "invalid");
  delete process.env.TURNSTILE_SECRET_KEY;
  assert.equal(await verifyTurnstile(request()), "unavailable");
  assert.equal(network.mock.callCount(), calls);
});
