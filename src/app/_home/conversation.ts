import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  answerDataSchema,
  answerErrors,
  answerRequestSchema,
  questionTextOf,
  type AnswerMessage,
  type AnswerRequest,
} from "@/lib/answer/schema";
import { resolveReference } from "./catalog";
import type { Message, PublicCatalog } from "./types";

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
  ).filter((m) => m.complete && m.answer);
  const previous = successful.at(-1);
  return answerRequestSchema.parse({
    question: current.metadata.question,
    previous: previous
      ? { question: previous.question, text: previous.answer!.text }
      : undefined,
    lastShownReferences:
      successful.findLast((m) => m.answer!.references.length)?.answer
        ?.references ?? [],
  });
}

export function createConversation(
  catalog: PublicCatalog,
  fetcher: typeof fetch = fetch,
) {
  function mark(outcome: "success" | "failed", error?: string) {
    const current = chat.messages.findLast((m) => m.role === "user");
    if (!current?.metadata) return;
    chat.messages = chat.messages.map((m) =>
      m.id === current.id
        ? {
            ...m,
            metadata: { question: current.metadata!.question, outcome, error },
          }
        : m,
    );
  }
  const chat = new Chat<AnswerMessage>({
    dataPartSchemas: { answer: answerDataSchema },
    transport: new DefaultChatTransport({
      api: "/api/answer",
      prepareSendMessagesRequest: ({ messages }) => ({
        body: shortRequest(messages),
      }),
      fetch: async (url, init) => {
        const response = await fetcher(url, init);
        if (!response.ok)
          throw new Error(
            response.status === 429
              ? answerErrors.limited
              : response.status === 503
                ? answerErrors.unavailable
                : response.status === 400
                  ? answerErrors.invalid
                  : answerErrors.failed,
          );
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
