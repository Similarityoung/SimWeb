"use client";

import Link from "next/link";
import { ViewTransition, useState, type ReactNode } from "react";

export function ArticleCardLink({
  href,
  articleId,
  title,
  children,
}: {
  href: string;
  articleId: string;
  title: string;
  children: ReactNode;
}) {
  const [opening, setOpening] = useState(false);

  return (
    <Link
      href={href}
      className="group block h-full rounded-xl"
      aria-label={title}
      onClick={(event) => {
        if (
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          setOpening(true);
        }
      }}
    >
      <ViewTransition
        name={opening ? `article-${articleId}` : undefined}
        share="article-opening"
        default="none"
      >
        {children}
      </ViewTransition>
    </Link>
  );
}
