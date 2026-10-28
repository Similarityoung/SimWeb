import {
  ACCESS_COOKIE,
  accessCookieHeader,
  issueAccessPass,
  readCookie,
  verifyAccessPass,
} from "@/lib/answer/access-pass.server";
import { answerErrors } from "@/lib/answer/schema";
import { isAiEnabled } from "@/config/ai.server";
import { verifyTurnstile } from "@/lib/answer/turnstile.server";

const noStore = { "Cache-Control": "no-store" };

function error(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: noStore });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export function GET(request: Request): Response {
  const valid = verifyAccessPass(
    readCookie(request, ACCESS_COOKIE),
    new URL(request.url).hostname,
  );
  return new Response(null, { status: valid ? 204 : 401, headers: noStore });
}

export async function POST(request: Request): Promise<Response> {
  if (!isAiEnabled()) return error(503, answerErrors.unavailable);
  if (!sameOrigin(request))
    return error(403, "Cross-origin requests are not allowed.");
  const verification = await verifyTurnstile(request);
  if (verification === "invalid") return error(403, answerErrors.verification);
  if (verification === "unavailable")
    return error(503, answerErrors.unavailable);
  const pass = issueAccessPass(new URL(request.url).hostname);
  if (!pass) return error(503, answerErrors.unavailable);
  return new Response(null, {
    status: 204,
    headers: {
      ...noStore,
      "Set-Cookie": accessCookieHeader(
        pass,
        new URL(request.url).protocol === "https:",
      ),
    },
  });
}
