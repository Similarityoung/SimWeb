"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { initialVisit, nextVisit, type HomeVisit } from "./home-visit";
import { useConversation } from "./use-conversation";
import type { PublicCatalog } from "./types";

const ConversationContext = createContext<
  | (ReturnType<typeof useConversation> & {
      catalog: PublicCatalog;
      arrival: HomeVisit["arrival"];
    })
  | null
>(null);

export function ConversationProvider({
  catalog,
  children,
}: {
  catalog: PublicCatalog;
  children: ReactNode;
}) {
  const conversation = useConversation(catalog);
  const pathname = usePathname();
  const [visit, setVisit] = useState(() => initialVisit(pathname));
  const current = nextVisit(visit, pathname);
  if (current !== visit) setVisit(current);
  return (
    <ConversationContext
      value={{ ...conversation, catalog, arrival: current.arrival }}
    >
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
