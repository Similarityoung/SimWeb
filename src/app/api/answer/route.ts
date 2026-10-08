import { createUIMessageStreamResponse } from "ai";
import {
  answerRequestSchema,
  answerErrors,
  MAX_BODY_BYTES,
} from "@/lib/answer/schema";
import { InvalidContextError } from "@/lib/answer/context.server";
import { createAnswerStream } from "@/lib/answer/service.server";
import { isAiEnabled } from "@/config/ai.server";
import { verifyTurnstile } from "@/lib/answer/turnstile.server";

export const maxDuration = 35;

const noStore = { "Cache-Control": "no-store" };
const maxBodyBytes = MAX_BODY_BYTES;

function error(status: number, message: string): Response {
  return Response.json({ error: message }, { status, headers: noStore });
}

async function readLimitedBody(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Empty body");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBodyBytes) throw new Error("Body too large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function POST(request: Request): Promise<Response> {
  if (!isAiEnabled()) return error(503, answerErrors.unavailable);
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    return error(415, "Expected JSON.");
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return error(403, "Cross-origin requests are not allowed.");
  let body: unknown;
  try {
    body = await readLimitedBody(request);
  } catch {
    return error(400, answerErrors.invalid);
  }
  const parsed = answerRequestSchema.safeParse(body);
  if (!parsed.success) return error(400, answerErrors.invalid);
  const verification = await verifyTurnstile(request);
  if (verification === "invalid") return error(403, answerErrors.verification);
  if (verification === "unavailable")
    return error(503, answerErrors.unavailable);
  try {
    return createUIMessageStreamResponse({
      stream: createAnswerStream(parsed.data, request.signal),
      headers: noStore,
    });
  } catch (cause) {
    return error(
      cause instanceof InvalidContextError ? 400 : 500,
      cause instanceof InvalidContextError
        ? answerErrors.invalid
        : answerErrors.failed,
    );
  }
}
