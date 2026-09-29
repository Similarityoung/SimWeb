"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BackLink } from "@/components/ui/back-link";
import { articleReturnTarget } from "@/lib/writing/reading-location";
import type { WritingKind } from "@/lib/writing/types";
import { useHomeConversation } from "@/app/_home/conversation-provider";

type Props = { kind: WritingKind; articleId: string };

export function ArticleReturnLink({ kind, articleId }: Props) {
  return (
    <Suspense fallback={<BackLink href={`/${kind}`} label={`All ${kind}`} />}>
      <ReturnTarget kind={kind} articleId={articleId} />
    </Suspense>
  );
}

function ReturnTarget({ kind, articleId }: Props) {
  const params = useSearchParams();
  const { messages } = useHomeConversation();
  const target = articleReturnTarget({
    kind,
    articleId,
    params,
    hasConversation: messages.length > 0,
  });
  return <BackLink {...target} />;
}
