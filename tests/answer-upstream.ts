import { createDeepSeek } from "@ai-sdk/deepseek";

// Real provider + SDK parsing against a controlled HTTP body; no model credentials.
export function fakeDeepSeek(
  output: string,
  options: {
    finish?: string;
    error?: boolean;
    status?: number;
    inspect?: (request: Record<string, unknown>) => void;
  } = {},
) {
  return createDeepSeek({
    apiKey: "test-only",
    fetch: async (_url, init) => {
      options.inspect?.(JSON.parse(String(init?.body)));
      if (options.status)
        return new Response("unavailable", { status: options.status });
      const chunk = (content: string, finish: string | null = null) => ({
        id: "test",
        object: "chat.completion.chunk",
        created: 1,
        model: "deepseek-flash",
        choices: [{ index: 0, delta: { content }, finish_reason: finish }],
      });
      const events: unknown[] = [];
      if (options.error)
        events.push({
          error: {
            message: "PRIVATE provider detail",
            type: "server_error",
            code: "error",
          },
        });
      for (let i = 0; i < output.length; i += 7)
        events.push(chunk(output.slice(i, i + 7)));
      events.push(chunk("", options.finish ?? "stop"));
      const bytes = new TextEncoder().encode(
        events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("") +
          "data: [DONE]\n\n",
      );
      return new Response(
        new ReadableStream({
          start(controller) {
            // Deliberately split UTF-8 and JSON tokens across transport chunks.
            for (let i = 0; i < bytes.length; i += 19)
              controller.enqueue(bytes.slice(i, i + 19));
            controller.close();
          },
        }),
        { headers: { "Content-Type": "text/event-stream" } },
      );
    },
  })("deepseek-flash");
}
