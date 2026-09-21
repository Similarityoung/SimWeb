"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { answerQuestion } from "./answer-question";
import type { Message, PublicCatalog, Question } from "./types";

export function useConversation(catalog: PublicCatalog) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  const submit = useCallback(
    async (question: Question) => {
      const text = question.text.trim();
      if (!text || text.length > 300 || request.current) return;
      const controller = new AbortController();
      request.current = controller;
      const id = crypto.randomUUID();
      setMessages((current) => [...current, { id, question: text }]);
      setPending(true);
      try {
        const answer = await answerQuestion(
          { ...question, text },
          catalog,
          controller.signal,
        );
        if (!controller.signal.aborted)
          setMessages((current) =>
            current.map((message) =>
              message.id === id ? { ...message, answer } : message,
            ),
          );
      } catch (error) {
        if (!controller.signal.aborted) {
          setMessages((current) =>
            current.map((message) =>
              message.id === id
                ? {
                    ...message,
                    error: "Something went wrong. Please try asking again.",
                  }
                : message,
            ),
          );
          console.error("Answer failed", error);
        }
      } finally {
        if (request.current === controller) {
          request.current = null;
          setPending(false);
        }
      }
    },
    [catalog],
  );

  const clear = useCallback(() => {
    request.current?.abort();
    request.current = null;
    setMessages([]);
    setPending(false);
  }, []);

  return { messages, pending, submit, clear };
}
