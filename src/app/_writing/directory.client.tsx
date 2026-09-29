"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArticleDirectory,
  ArticleDirectorySkeleton,
} from "@/components/writing/article-directory";
import {
  DirectoryActiveFilters,
  DirectoryFilters,
  DirectoryFrame,
  DirectoryPagination,
  DirectorySearch,
} from "@/components/writing/directory-controls";
import {
  browseDirectory,
  directoryFacets,
  directoryHref,
  readDirectoryQuery,
  type DirectoryPage,
  type DirectoryQuery,
} from "@/lib/writing/directory";
import { articleAnchor } from "@/lib/writing/reading-location";
import { searchDirectory } from "@/lib/writing/search.client";
import type { ArticleSummary, WritingKind } from "@/lib/writing/types";

type SearchResult =
  { key: string; page: DirectoryPage } | { key: string; error: true };
type FilterChange = { field: "category" | "tag"; value?: string };

export function DirectoryClient({
  kind,
  articles,
}: {
  kind: WritingKind;
  articles: readonly ArticleSummary[];
}) {
  const params = useSearchParams();
  const location = params.toString();
  const query = useMemo(
    () => readDirectoryQuery(kind, new URLSearchParams(location)),
    [kind, location],
  );
  const facets = useMemo(
    () => directoryFacets(articles, kind),
    [articles, kind],
  );
  const browse = useMemo(
    () => (query.q ? null : browseDirectory(articles, kind, query)),
    [articles, kind, query],
  );
  // Internal page normalization must not discard an unfinished search draft.
  const inputLocation = directoryHref(kind, { ...query, page: 1 });
  const [editing, setEditing] = useState({
    location: inputLocation,
    text: query.q,
  });
  const draft = editing.location === inputLocation ? editing.text : query.q;
  const [navigation, setNavigation] = useState(0);
  const [result, setResult] = useState<SearchResult | null>(null);
  const requestKey = directoryHref(kind, query);
  const current = result?.key === requestKey ? result : null;
  const page = browse ?? (current && "page" in current ? current.page : null);
  const failed = !!query.q && !!current && "error" in current;
  const pending = !page && !failed;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const composing = useRef(false);
  const queuedFilter = useRef<FilterChange | null>(null);
  const restore = useRef<string | null>(null);
  const pageTop = useRef(false);
  const resultsElement = useRef<HTMLDivElement>(null);

  function cancelInput() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  function commit(next: DirectoryQuery, mode: "push" | "replace") {
    cancelInput();
    if (window.location.pathname !== `/${kind}`) return;
    queuedFilter.current = null;
    restore.current = null;
    const href = directoryHref(kind, next);
    const nextLocation = directoryHref(kind, { ...next, page: 1 });
    setEditing({ location: nextLocation, text: next.q.trim() });
    if (`${window.location.pathname}${window.location.search}` !== href) {
      generation.current += 1;
      window.history[mode === "push" ? "pushState" : "replaceState"](
        null,
        "",
        href,
      );
    } else if (window.location.hash) {
      window.history.replaceState(null, "", href);
    }
  }

  function submitText(text: string) {
    const latest = readDirectoryQuery(
      kind,
      new URLSearchParams(window.location.search),
    );
    commit({ ...latest, q: text, page: 1 }, "replace");
  }

  function schedule(text: string) {
    cancelInput();
    if (!composing.current) {
      const expectedLocation = inputLocation;
      timer.current = setTimeout(() => {
        const latest = readDirectoryQuery(
          kind,
          new URLSearchParams(window.location.search),
        );
        if (directoryHref(kind, { ...latest, page: 1 }) === expectedLocation)
          submitText(text);
      }, 300);
    }
  }

  function selectFilter(field: "category" | "tag", value?: string) {
    cancelInput();
    if (composing.current) {
      queuedFilter.current = { field, value };
      return;
    }
    const latest = readDirectoryQuery(
      kind,
      new URLSearchParams(window.location.search),
    );
    commit({ ...latest, q: draft, [field]: value, page: 1 }, "push");
  }

  useEffect(() => {
    function navigate() {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      queuedFilter.current = null;
      composing.current = false;
      generation.current += 1;
      const next = readDirectoryQuery(
        kind,
        new URLSearchParams(window.location.search),
      );
      setEditing({
        location: directoryHref(kind, { ...next, page: 1 }),
        text: next.q,
      });
      setNavigation((value) => value + 1);
    }
    window.addEventListener("popstate", navigate);
    return () => {
      window.removeEventListener("popstate", navigate);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [kind]);

  useEffect(() => {
    restore.current = window.location.hash.slice(1) || null;
    function cancelRestore() {
      restore.current = null;
      pageTop.current = false;
    }
    window.addEventListener("wheel", cancelRestore, { passive: true });
    window.addEventListener("touchstart", cancelRestore, { passive: true });
    window.addEventListener("pointerdown", cancelRestore);
    window.addEventListener("keydown", cancelRestore);
    return () => {
      window.removeEventListener("wheel", cancelRestore);
      window.removeEventListener("touchstart", cancelRestore);
      window.removeEventListener("pointerdown", cancelRestore);
      window.removeEventListener("keydown", cancelRestore);
    };
  }, [kind, navigation]);

  useEffect(() => {
    const activeGeneration = ++generation.current;
    let active = true;
    const isCurrent = () =>
      active &&
      generation.current === activeGeneration &&
      window.location.pathname === `/${kind}` &&
      directoryHref(
        kind,
        readDirectoryQuery(kind, new URLSearchParams(window.location.search)),
      ) === requestKey;
    function canonicalize(next: DirectoryPage) {
      if (!isCurrent()) return;
      const href = directoryHref(kind, next.query);
      if (`${window.location.pathname}${window.location.search}` !== href) {
        window.history.replaceState(null, "", `${href}${window.location.hash}`);
      }
    }
    if (browse) canonicalize(browse);
    else if (current) {
      if ("page" in current) canonicalize(current.page);
    } else {
      searchDirectory(articles, kind, query)
        .then((next) => {
          if (!isCurrent()) return;
          setResult({ key: directoryHref(kind, next.query), page: next });
          canonicalize(next);
        })
        .catch(() => {
          if (isCurrent()) setResult({ key: requestKey, error: true });
        });
    }
    return () => {
      active = false;
    };
  }, [articles, browse, current, kind, navigation, query, requestKey]);

  useEffect(() => {
    if (!page) return;
    const activeGeneration = generation.current;
    const frame = requestAnimationFrame(() => {
      if (activeGeneration !== generation.current) return;
      const anchor = restore.current;
      if (
        anchor &&
        page.items.some((article) => articleAnchor(article.id) === anchor)
      ) {
        const element = document.getElementById(anchor);
        if (element) {
          element
            .querySelector<HTMLAnchorElement>("a")
            ?.focus({ preventScroll: true });
          element.scrollIntoView({ block: "center", behavior: "instant" });
          restore.current = null;
        }
      } else if (pageTop.current) {
        resultsElement.current?.scrollIntoView({
          block: "start",
          behavior: "instant",
        });
        pageTop.current = false;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [page, navigation]);

  return (
    <DirectoryFrame
      kind={kind}
      filters={
        <DirectoryFilters
          kind={kind}
          query={query}
          facets={facets}
          total={articles.length}
          onSelect={selectFilter}
        />
      }
      search={
        <DirectorySearch
          kind={kind}
          value={draft}
          onChange={(event) => {
            const text = event.target.value;
            setEditing({ location: inputLocation, text });
            schedule(text);
          }}
          onSubmit={(event) => {
            event.preventDefault();
            if (!composing.current) submitText(draft);
          }}
          onCompositionStart={() => {
            composing.current = true;
            cancelInput();
          }}
          onCompositionEnd={(event) => {
            composing.current = false;
            const text = event.currentTarget.value;
            setEditing({ location: inputLocation, text });
            const filter = queuedFilter.current;
            if (filter)
              commit(
                {
                  ...readDirectoryQuery(
                    kind,
                    new URLSearchParams(window.location.search),
                  ),
                  q: text,
                  [filter.field]: filter.value,
                  page: 1,
                },
                "push",
              );
            else schedule(text);
          }}
        />
      }
    >
      {kind === "notes" && (
        <DirectoryActiveFilters
          query={query}
          onClear={(field) => {
            if (field) selectFilter(field);
            else {
              composing.current = false;
              commit({ q: "", page: 1 }, "push");
            }
          }}
        />
      )}
      <div ref={resultsElement} className="scroll-mt-8" aria-busy={pending}>
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={
            kind === "notes"
              ? "mb-4 min-h-5 text-xs text-muted-foreground"
              : "sr-only"
          }
        >
          {pending
            ? "Searching…"
            : failed
              ? "Search unavailable"
              : `${page?.total ?? 0} ${page?.total === 1 ? kind.slice(0, -1) : kind}${query.q ? " · By relevance" : " · Latest first"}`}
        </p>
        {failed ? (
          <div role="alert" className="rounded-lg border p-6">
            <h2 className="font-medium">Search couldn’t load</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Refresh the page to load the search index again.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4 h-11"
            >
              Refresh page
            </Button>
          </div>
        ) : page ? (
          <>
            <ArticleDirectory kind={kind} page={page} />
            <DirectoryPagination
              kind={kind}
              page={page}
              disabled={draft.trim() !== query.q}
              onPage={(number) => {
                pageTop.current = true;
                commit({ ...page.query, page: number }, "push");
              }}
            />
          </>
        ) : (
          <ArticleDirectorySkeleton />
        )}
      </div>
    </DirectoryFrame>
  );
}
