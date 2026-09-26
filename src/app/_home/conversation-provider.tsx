"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { usePathname } from "next/navigation";
import { initialVisit, nextVisit, type HomeVisit } from "./home-visit";
import { useConversation } from "./use-conversation";
import type { PublicCatalog } from "./types";

const ConversationContext = createContext<
  | (ReturnType<typeof useConversation> & {
      catalog: PublicCatalog;
      arrival: HomeVisit["arrival"];
      scrollPositionRef: RefObject<{ messageId?: string; top: number }>;
    })
  | null
>(null);

export function ConversationProvider({
  catalog,
  aiEnabled,
  children,
}: {
  catalog: PublicCatalog;
  aiEnabled: boolean;
  children: ReactNode;
}) {
  const conversation = useConversation(catalog, aiEnabled);
  const scrollPositionRef = useRef<{ messageId?: string; top: number }>({
    top: 0,
  });
  const pathname = usePathname();
  const [visit, setVisit] = useState(() => initialVisit(pathname));
  const current = nextVisit(visit, pathname);
  if (current !== visit) setVisit(current);
  return (
    <ConversationContext
      value={{
        ...conversation,
        catalog,
        arrival: current.arrival,
        scrollPositionRef,
      }}
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
