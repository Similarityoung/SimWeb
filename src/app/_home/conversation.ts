import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  answerDataSchema,
  answerErrors,
  questionTextOf,
  type AnswerMessage,
  type AnswerRequest,
} from "@/lib/answer/schema";
import { resolveReference } from "./catalog";
import type { Message, PublicCatalog } from "./types";

// AI SDK 7 types use the data name; its stream reader looks up the full part type.
const answerPartSchemas = {
  answer: answerDataSchema,
  "data-answer": answerDataSchema,
};

function responseError(status: number): Error {
  switch (status) {
    case 400:
      return new Error(answerErrors.invalid);
    case 403:
      return new Error(answerErrors.verification);
    case 429:
      return new Error(answerErrors.limited);
    case 503:
      return new Error(answerErrors.unavailable);
    default:
      return new Error(answerErrors.failed);
  }
}

export function exchanges(messages: readonly AnswerMessage[]): Message[] {
  const result: Message[] = [];
  for (const message of messages) {
    if (message.role === "user" && message.metadata) {
      result.push({
        id: message.id,
        question: questionTextOf(message.metadata.question),
        complete: message.metadata.outcome === "success",
        error: message.metadata.error,
      });
    } else if (message.role === "assistant") {
      const exchange = result.at(-1);
      const part = message.parts.find((p) => p.type === "data-answer");
      if (exchange && part?.type === "data-answer") {
        exchange.text =
          part.data.status === "streaming"
            ? part.data.text
            : part.data.answer.text;
        if (part.data.status === "complete" && exchange.complete)
          exchange.answer = part.data.answer;
      }
    }
  }
  return result;
}

export function shortRequest(
  messages: readonly AnswerMessage[],
): AnswerRequest {
  const current = messages.findLast((m) => m.role === "user");
  if (!current?.metadata) throw new Error(answerErrors.invalid);
  const successful = exchanges(
    messages.slice(0, messages.indexOf(current)),
  ).flatMap((m) =>
    m.complete && m.answer ? [{ question: m.question, answer: m.answer }] : [],
  );
  const previous = successful.at(-1);
  return {
    question: current.metadata.question,
    previous: previous
      ? { question: previous.question, text: previous.answer.text }
      : undefined,
    lastShownReferences:
      successful.findLast((m) => m.answer.references.length)?.answer
        .references ?? [],
  };
}

export function createConversation(
  catalog: PublicCatalog,
  getToken: (signal?: AbortSignal | null) => Promise<string>,
  fetcher: typeof fetch = fetch,
) {
  async function ensureAccess(signal?: AbortSignal | null) {
    const status = await fetcher("/api/answer/access", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      signal,
    });
    signal?.throwIfAborted();
    if (status.status === 204) return;
    if (status.status !== 401) throw responseError(status.status);
    const token = await getToken(signal);
    signal?.throwIfAborted();
    const handshake = await fetcher("/api/answer/access", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { "x-turnstile-token": token },
      signal,
    });
    if (!handshake.ok) throw responseError(handshake.status);
  }
  function mark(outcome: "success" | "failed", error?: string) {
    const current = chat.messages.findLast((m) => m.role === "user");
    if (!current?.metadata) return;
    const { question } = current.metadata;
    chat.messages = chat.messages.map((m) =>
      m.id === current.id
        ? {
            ...m,
            metadata: { question, outcome, error },
          }
        : m,
    );
  }
  const chat = new Chat<AnswerMessage>({
    dataPartSchemas: answerPartSchemas,
    transport: new DefaultChatTransport({
      api: "/api/answer",
      prepareSendMessagesRequest: ({ messages }) => ({
        body: shortRequest(messages),
      }),
      fetch: async (url, init) => {
        await ensureAccess(init?.signal);
        init?.signal?.throwIfAborted();
        const response = await fetcher(url, {
          ...init,
          credentials: "same-origin",
        });
        if (!response.ok) throw responseError(response.status);
        return response;
      },
    }),
    onError: (error) =>
      mark(
        "failed",
        Object.values(answerErrors).some((text) => text === error.message)
          ? error.message
          : answerErrors.failed,
      ),
    onFinish: ({ message, isAbort, isError, isDisconnect, finishReason }) => {
      const part = message.parts.find((p) => p.type === "data-answer");
      if (
        !isAbort &&
        !isError &&
        !isDisconnect &&
        finishReason === "stop" &&
        part?.type === "data-answer" &&
        part.data.status === "complete"
      ) {
        try {
          part.data.answer.references.forEach((ref) =>
            resolveReference(ref, catalog),
          );
          mark("success");
          return;
        } catch {
          /* A stale browser catalog must not create broken cards. */
        }
      }
      const error = chat.messages.findLast((m) => m.role === "user")?.metadata
        ?.error;
      mark("failed", error ?? answerErrors.failed);
    },
  });
  return chat;
}
