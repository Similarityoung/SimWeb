import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCESS_TTL_SECONDS,
  ACCESS_COOKIE,
  accessCookieHeader,
  issueAccessPass,
  readCookie,
  verifyAccessPass,
} from "./access-pass.server";

test("access pass is signed, hostname-bound, tamper evident and expires at its fixed deadline", (t) => {
  const oldSecret = process.env.TURNSTILE_SECRET_KEY;
  process.env.TURNSTILE_SECRET_KEY = "test-secret";
  t.after(() => {
    if (oldSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = oldSecret;
  });
  const now = 1_800_000_000_000;
  const pass = issueAccessPass("www.simi.host", now)!;
  assert.equal(verifyAccessPass(pass, "www.simi.host", now), true);
  assert.equal(verifyAccessPass(pass, "sim-web.vercel.app", now), false);
  assert.equal(
    verifyAccessPass(pass, "www.simi.host", now + ACCESS_TTL_SECONDS * 1000),
    false,
  );
  const [payload, signature] = pass.split(".");
  assert.equal(
    verifyAccessPass(`${payload}x.${signature}`, "www.simi.host", now),
    false,
  );
  assert.equal(
    verifyAccessPass(
      `${payload}.${"a".repeat(signature.length)}`,
      "www.simi.host",
      now,
    ),
    false,
  );
  assert.equal(verifyAccessPass(undefined, "www.simi.host", now), false);
  assert.equal(verifyAccessPass(`${pass}.extra`, "www.simi.host", now), false);
});

test("missing signing secret fails closed and cookie attributes protect browser access", (t) => {
  const oldSecret = process.env.TURNSTILE_SECRET_KEY;
  delete process.env.TURNSTILE_SECRET_KEY;
  t.after(() => {
    if (oldSecret !== undefined) process.env.TURNSTILE_SECRET_KEY = oldSecret;
  });
  assert.equal(issueAccessPass("localhost"), undefined);
  assert.equal(verifyAccessPass("anything", "localhost"), false);
  assert.match(
    accessCookieHeader("signed.value", true),
    /HttpOnly; SameSite=Lax; Secure$/,
  );
  assert.match(
    accessCookieHeader("signed.value", false),
    /Path=\/api; Max-Age=/,
  );
  const request = new Request("https://www.simi.host", {
    headers: { Cookie: `other=1; ${ACCESS_COOKIE}=signed.value` },
  });
  assert.equal(readCookie(request, ACCESS_COOKIE), "signed.value");
});
