import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE = "simweb_answer_access";
export const ACCESS_TTL_SECONDS = 6 * 60 * 60;

function signature(value: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`simweb-answer-access:v1:${value}`)
    .digest("base64url");
}

function secret(): string | undefined {
  return process.env.TURNSTILE_SECRET_KEY || undefined;
}

export function issueAccessPass(
  hostname: string,
  now = Date.now(),
): string | undefined {
  const key = secret();
  if (!key) return undefined;
  const payload = Buffer.from(
    JSON.stringify({
      v: 1,
      host: hostname,
      exp: Math.floor(now / 1000) + ACCESS_TTL_SECONDS,
    }),
  ).toString("base64url");
  return `${payload}.${signature(payload, key)}`;
}

export function verifyAccessPass(
  token: string | undefined,
  hostname: string,
  now = Date.now(),
): boolean {
  const key = secret();
  if (!key || !token || token.length > 512) return false;
  const [payload, supplied, extra] = token.split(".");
  if (!payload || !supplied || extra !== undefined) return false;
  const expected = signature(payload, key);
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  if (
    suppliedBytes.length !== expectedBytes.length ||
    !timingSafeEqual(suppliedBytes, expectedBytes)
  )
    return false;
  try {
    const claims: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    );
    return (
      typeof claims === "object" &&
      claims !== null &&
      "v" in claims &&
      claims.v === 1 &&
      "host" in claims &&
      claims.host === hostname &&
      "exp" in claims &&
      typeof claims.exp === "number" &&
      Number.isInteger(claims.exp) &&
      claims.exp > Math.floor(now / 1000)
    );
  } catch {
    return false;
  }
}

export function readCookie(request: Request, name: string): string | undefined {
  const cookies = request.headers.get("cookie")?.split(";") ?? [];
  for (const cookie of cookies) {
    const separator = cookie.indexOf("=");
    if (separator < 0 || cookie.slice(0, separator).trim() !== name) continue;
    return cookie.slice(separator + 1).trim();
  }
}

export function accessCookieHeader(value: string, secure: boolean): string {
  return `${ACCESS_COOKIE}=${value}; Path=/api; Max-Age=${ACCESS_TTL_SECONDS}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}
