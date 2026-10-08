import { test as base, expect } from "@playwright/test";
import { createUIMessageStream, createUIMessageStreamResponse } from "ai";
import { readPublishedArticles } from "../../src/lib/writing/catalog";
import { projects } from "../../src/lib/projects/data";
import type {
  Answer,
  AnswerMessage,
  AnswerRequest,
} from "../../src/lib/answer/schema";

export { expect };
declare global {
  interface Window {
    __answers: {
      manual: boolean;
      tokens: string[];
      requests: AnswerRequest[];
      pending: Array<() => boolean>;
      advance: (count?: number) => void;
      flush: () => void;
      failNext?: number;
      disconnectBeforeFinish?: boolean;
    };
  }
}
const published = readPublishedArticles("content").map((p) => p.article);
async function frames(answer: Answer) {
  return (
    await createUIMessageStreamResponse({
      stream: createUIMessageStream<AnswerMessage>({
        execute: ({ writer }) => {
          writer.write({ type: "start" });
          for (const size of [8, 18, 31, 48, answer.text.length])
            writer.write({
              type: "data-answer",
              id: "answer",
              data: { status: "streaming", text: answer.text.slice(0, size) },
            });
          writer.write({
            type: "data-answer",
            id: "answer",
            data: { status: "complete", answer },
          });
          writer.write({ type: "finish", finishReason: "stop" });
          writer.setOutcome({ status: "completed" });
        },
      }),
    }).text()
  )
    .split("\n\n")
    .filter(Boolean)
    .map((frame) => `${frame}\n\n`);
}

export const test = base.extend<{ answerMock: void }>({
  answerMock: [
    async ({ page }, use) => {
      const payloads: Record<string, string[]> = {};
      for (const topic of [
        "notes",
        "thoughts",
        "projects",
        "about",
        "unmatched",
      ]) {
        const articles = published
          .filter((a) => a.kind === topic)
          .sort(
            (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
          );
        payloads[topic] = await frames({
          kind: topic === "unmatched" ? "unmatched" : "answer",
          text:
            topic === "unmatched"
              ? "I can only discuss the author's projects and published writing. Please ask about those."
              : "Hello! Here is a selection of my projects and published writing, based on the public information on this site.",
          references:
            topic === "projects"
              ? projects.map((p) => ({ type: "project", id: p.id }))
              : [...articles.slice(0, 3), ...articles.slice(3).slice(-2)].map(
                  (a) => ({ type: "article", id: a.id }),
                ),
        });
      }
      await page.route(
        "https://challenges.cloudflare.com/turnstile/v0/api.js*",
        (route) =>
          route.fulfill({
            contentType: "application/javascript",
            body: `
          let counter = 0;
          window.turnstile = {
            render(container, options) {
              const id = String(++counter);
              queueMicrotask(() => options.callback("test-token-" + id));
              return id;
            },
            remove() {}
          };
        `,
          }),
      );
      await page.addInitScript((payloads) => {
        const nativeFetch = window.fetch.bind(window);
        window.__answers = {
          manual: false,
          tokens: [],
          requests: [],
          pending: [],
          advance(count = 1) {
            for (let i = 0; i < count; i++) window.__answers.pending[0]?.();
          },
          flush() {
            while (window.__answers.pending.length)
              window.__answers.pending[0]();
          },
        };
        window.fetch = async (input, init) => {
          const url =
            typeof input === "string"
              ? input
              : input instanceof URL
                ? input.href
                : input.url;
          if (!new URL(url, location.href).pathname.endsWith("/api/answer"))
            return nativeFetch(input, init);
          const body = JSON.parse(String(init?.body)) as AnswerRequest;
          const control = window.__answers;
          const token = new Headers(init?.headers).get("x-turnstile-token");
          if (!token) throw new Error("Missing verification token");
          control.tokens.push(token);
          control.requests.push(body);
          if (control.failNext) {
            const status = control.failNext;
            control.failNext = undefined;
            return new Response("upstream unavailable", { status });
          }
          const question = body.question;
          const topic =
            question.type === "topic"
              ? question.topic
              : /天气|weather/.test(question.text)
                ? "unmatched"
                : /projects/i.test(question.text)
                  ? "projects"
                  : "about";
          const frames = payloads[topic];
          let index = 0;
          let ended = false;
          let timer: ReturnType<typeof setTimeout> | undefined;
          return new Response(
            new ReadableStream({
              start(controller) {
                const remove = () => {
                  ended = true;
                  clearTimeout(timer);
                  control.pending = control.pending.filter(
                    (fn) => fn !== advance,
                  );
                  init?.signal?.removeEventListener("abort", abort);
                };
                const abort = () => {
                  if (!ended) {
                    remove();
                    controller.error(
                      new DOMException("Cancelled", "AbortError"),
                    );
                  }
                };
                const advance = () => {
                  if (ended) return false;
                  const frame = frames[index++];
                  if (
                    !frame ||
                    (control.disconnectBeforeFinish &&
                      frame.includes('"type":"finish"'))
                  ) {
                    remove();
                    controller.close();
                    return false;
                  }
                  controller.enqueue(new TextEncoder().encode(frame));
                  if (!control.manual) timer = setTimeout(advance, 180);
                  return true;
                };
                control.pending.push(advance);
                init?.signal?.addEventListener("abort", abort, { once: true });
                if (init?.signal?.aborted) abort();
                else advance();
              },
            }),
            {
              headers: {
                "Content-Type": "text/event-stream",
                "x-vercel-ai-ui-message-stream": "v1",
              },
            },
          );
        };
      }, payloads);
      await use();
    },
    { auto: true },
  ],
});
