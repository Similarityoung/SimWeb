"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  questionSchema,
  questionTextOf,
  type Question,
} from "@/lib/answer/schema";
import { createConversation, exchanges } from "./conversation";
import type { PublicCatalog } from "./types";

export function useConversation(
  catalog: PublicCatalog,
  getToken: (signal?: AbortSignal | null) => Promise<string>,
) {
  const [chat, setChat] = useState(() => createConversation(catalog, getToken));
  const state = useChat({ chat });
  useEffect(
    () => () => {
      void chat.stop();
    },
    [chat],
  );
  const messages = useMemo(() => exchanges(state.messages), [state.messages]);
  const submit = useCallback(
    (question: Question) => {
      const parsed = questionSchema.safeParse(question);
      if (
        !parsed.success ||
        chat.status === "submitted" ||
        chat.status === "streaming"
      )
        return;
      void chat.sendMessage({
        role: "user",
        parts: [{ type: "text", text: questionTextOf(parsed.data) }],
        metadata: { question: parsed.data },
      });
    },
    [chat],
  );
  const clear = useCallback(() => {
    void chat.stop();
    // Each session owns its Chat. Late callbacks only mutate the retired instance.
    setChat(createConversation(catalog, getToken));
  }, [catalog, chat, getToken]);
  return {
    messages,
    pending: state.status === "submitted" || state.status === "streaming",
    status: state.status,
    submit,
    clear,
  };
}
