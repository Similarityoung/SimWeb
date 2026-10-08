import assert from "node:assert/strict";
import test from "node:test";
import { createTurnstileChallenge, type TurnstileApi } from "./turnstile";

test("each question gets a fresh challenge and cancelled callbacks cannot affect a new request", async () => {
  const callbacks: Array<Parameters<TurnstileApi["render"]>[1]> = [];
  const removed: string[] = [];
  const challenge = createTurnstileChallenge("test-key");
  const api: TurnstileApi = {
    render: (_container, options) => {
      callbacks.push(options);
      return String(callbacks.length);
    },
    remove: (widget) => {
      removed.push(widget);
    },
  };
  const controller = new AbortController();
  const first = challenge.getToken(controller.signal);
  // A question submitted before the script is ready still waits for verification.
  challenge.mount(api, {} as HTMLElement);
  controller.abort();
  await assert.rejects(first, { name: "AbortError" });
  const second = challenge.getToken();
  callbacks[0].callback("old-token");
  callbacks[1].callback("fresh-token");
  assert.equal(await second, "fresh-token");
  assert.deepEqual(removed, ["1", "2"]);
  const third = challenge.getToken();
  callbacks[2]["error-callback"]();
  await assert.rejects(third, /verify/);
  challenge.dispose();
});

test("missing configuration and script failure cannot issue a token", async () => {
  await assert.rejects(
    createTurnstileChallenge(undefined).getToken(),
    /not available/,
  );
  const challenge = createTurnstileChallenge("test-key");
  const pending = challenge.getToken();
  challenge.fail();
  await assert.rejects(pending, /verify/);
  await assert.rejects(challenge.getToken(), /verify/);
});
