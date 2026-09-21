"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useConversation } from "./use-conversation";
import type { PublicCatalog } from "./types";

const ConversationContext = createContext<
  (ReturnType<typeof useConversation> & { catalog: PublicCatalog }) | null
>(null);

export function ConversationProvider({
  catalog,
  children,
}: {
  catalog: PublicCatalog;
  children: ReactNode;
}) {
  const conversation = useConversation(catalog);
  return (
    <ConversationContext value={{ ...conversation, catalog }}>
      {children}
    </ConversationContext>
  );
}

export function useHomeConversation() {
  const context = useContext(ConversationContext);
  if (!context)
    throw new Error("Home conversation requires ConversationProvider");
  return context;
}
