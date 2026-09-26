"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import type { WritingKind } from "@/lib/writing/types";
import { useHomeConversation } from "./conversation-provider";

export function ArticleReturnLink({ kind }: { kind: WritingKind }) {
  return (
    <Suspense fallback={<BackLink href={`/${kind}`} label={`All ${kind}`} />}>
      <ReturnTarget kind={kind} />
    </Suspense>
  );
}

function ReturnTarget({ kind }: { kind: WritingKind }) {
  const source = useSearchParams().get("from");
  const { messages } = useHomeConversation();
  const conversation = source === "conversation" && messages.length > 0;
  return (
    <BackLink
      href={conversation ? "/" : `/${kind}`}
      label={
        conversation
          ? "Back to conversation"
          : source === "directory"
            ? `Back to ${kind === "notes" ? "Notes" : "Thoughts"}`
            : `All ${kind}`
      }
    />
  );
}
