import { Search, X } from "lucide-react";
import type {
  ChangeEventHandler,
  CompositionEventHandler,
  FormEventHandler,
  MouseEvent,
  ReactNode,
} from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageFrame, PageTitle } from "@/components/site/page-shell";
import {
  directoryHref,
  DIRECTORY_PAGE_SIZE,
  type DirectoryPage,
  type DirectoryQuery,
} from "@/lib/writing/directory";
import type { WritingKind } from "@/lib/writing/types";
import { cn } from "@/lib/utils";

type FilterField = "category" | "tag";
type Facet = { value: string; count: number };

function isPlainClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export function DirectoryFrame({
  kind,
  search,
  filters,
  children,
}: {
  kind: WritingKind;
  search?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
}) {
  if (kind === "thoughts") {
    return (
      <PageFrame>
        <header className="mb-12 sm:mb-14">
          <PageTitle>Thoughts</PageTitle>
        </header>
        {children}
      </PageFrame>
    );
  }
  return (
    <PageFrame>
      <header className="mb-6 flex flex-col gap-6 md:mb-8 md:flex-row md:items-end md:justify-between">
        <PageTitle>Notes</PageTitle>
        <div className="w-full md:w-72">{search}</div>
      </header>
      <div className="grid gap-6 md:grid-cols-[10.5rem_minmax(0,1fr)] md:gap-8">
        <aside className="min-w-0">{filters}</aside>
        <div className="min-w-0">{children}</div>
      </div>
    </PageFrame>
  );
}

export function DirectorySearch({
  kind,
  value,
  disabled = false,
  onChange,
  onSubmit,
  onCompositionStart,
  onCompositionEnd,
}: {
  kind: WritingKind;
  value: string;
  disabled?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  onCompositionStart?: () => void;
  onCompositionEnd?: CompositionEventHandler<HTMLInputElement>;
}) {
  const label = `Search ${kind === "notes" ? "Notes" : "Thoughts"}`;
  return (
    <form role="search" action={`/${kind}`} onSubmit={onSubmit} lang="en">
      <label htmlFor={`${kind}-search`} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted-foreground"
          strokeWidth={1.5}
          aria-hidden
        />
        <Input
          id={`${kind}-search`}
          name="q"
          type="search"
          value={value}
          disabled={disabled}
          readOnly={!onChange}
          onChange={onChange}
          onCompositionStart={onCompositionStart}
          onCompositionEnd={onCompositionEnd}
          placeholder={`Search ${kind}…`}
          className="h-11 rounded-lg bg-transparent pr-4 pl-10 shadow-none dark:bg-transparent"
          autoComplete="off"
        />
      </div>
    </form>
  );
}

export function DirectoryFilters({
  kind,
  query,
  facets,
  total,
  onSelect,
}: {
  kind: WritingKind;
  query: DirectoryQuery;
  facets: { categories: Facet[]; tags: Facet[] };
  total: number;
  onSelect?: (field: FilterField, value?: string) => void;
}) {
  const groups = [
    {
      field: "category" as const,
      title: "Categories",
      values: facets.categories,
    },
    { field: "tag" as const, title: "Tags", values: facets.tags },
  ];
  return (
    <div lang="en">
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {groups.map(({ field, title, values }) => (
          <div key={field} className="min-w-0">
            <label
              htmlFor={`${kind}-${field}`}
              className="mb-2 block text-xs text-muted-foreground"
            >
              {title}
            </label>
            <Select
              value={
                query[field] === undefined ? "all" : `value:${query[field]}`
              }
              disabled={!onSelect}
              onValueChange={
                onSelect
                  ? (value) =>
                      onSelect(
                        field,
                        value === "all" ? undefined : value.slice(6),
                      )
                  : undefined
              }
            >
              <SelectTrigger id={`${kind}-${field}`} aria-label={title}>
                <SelectValue>{query[field] ?? "All"}</SelectValue>
              </SelectTrigger>
              <SelectContent className="min-w-56">
                <SelectItem value="all" textValue="All">
                  <span className="flex items-center justify-between gap-4">
                    <span>All</span>{" "}
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {total}
                    </span>
                  </span>
                </SelectItem>
                {query[field] &&
                  !values.some(({ value }) => value === query[field]) && (
                    <SelectItem
                      value={`value:${query[field]}`}
                      textValue={query[field]}
                    >
                      {query[field]} (0)
                    </SelectItem>
                  )}
                {values.map(({ value, count }) => (
                  <SelectItem
                    key={value}
                    value={`value:${value}`}
                    textValue={value}
                  >
                    <span className="flex items-center justify-between gap-4">
                      <span>{value}</span>{" "}
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {count}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
      <div className="hidden space-y-6 md:block">
        {groups.map(({ field, title, values }) => (
          <nav key={field} aria-label={title}>
            <h2 className="mb-2 px-2 text-xs text-muted-foreground">{title}</h2>
            <ul>
              {[{ value: undefined, count: total }, ...values].map(
                ({ value, count }) => (
                  <li key={value === undefined ? "all" : `value-${value}`}>
                    <a
                      href={directoryHref(kind, {
                        ...query,
                        [field]: value,
                        page: 1,
                      })}
                      aria-current={query[field] === value ? "true" : undefined}
                      onClick={
                        onSelect
                          ? (event) => {
                              if (isPlainClick(event)) {
                                event.preventDefault();
                                onSelect(field, value);
                              }
                            }
                          : undefined
                      }
                      className={cn(
                        "flex min-h-8 items-center justify-between gap-3 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-muted hover:text-foreground",
                        query[field] === value
                          ? "bg-muted font-medium text-accent"
                          : "text-muted-foreground",
                      )}
                    >
                      <span className="min-w-0 break-words">
                        {value ?? "All"}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {count}
                      </span>
                    </a>
                  </li>
                ),
              )}
            </ul>
            {query[field] &&
              !values.some(({ value }) => value === query[field]) && (
                <p className="mt-2 px-2 text-xs leading-6 text-muted-foreground">
                  No articles in “{query[field]}”. Select All to clear it.
                </p>
              )}
          </nav>
        ))}
      </div>
    </div>
  );
}

export function DirectoryActiveFilters({
  query,
  onClear,
}: {
  query: DirectoryQuery;
  onClear: (field?: FilterField) => void;
}) {
  if (!query.q && !query.category && !query.tag) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 text-xs" lang="en">
      {query.q && (
        <span className="mr-1 break-all text-muted-foreground">
          Search: “{query.q}”
        </span>
      )}
      {(["category", "tag"] as const).map(
        (field) =>
          query[field] && (
            <button
              key={field}
              type="button"
              onClick={() => onClear(field)}
              aria-label={`Remove ${field} ${query[field]}`}
              className="inline-flex min-h-9 max-w-full items-center gap-2 rounded-md border px-2.5 py-1.5 hover:bg-muted"
            >
              <span className="min-w-0 break-all">
                {field === "category" ? "Category" : "Tag"}: {query[field]}
              </span>
              <X className="size-3.5 shrink-0" strokeWidth={1.5} aria-hidden />
            </button>
          ),
      )}
      <button
        type="button"
        onClick={() => onClear()}
        className="min-h-9 px-2 py-1.5 text-muted-foreground underline decoration-border-strong underline-offset-4 hover:text-foreground"
      >
        Clear all
      </button>
    </div>
  );
}

export function DirectoryPagination({
  kind,
  page,
  disabled = false,
  onPage,
}: {
  kind: WritingKind;
  page: DirectoryPage;
  disabled?: boolean;
  onPage?: (page: number) => void;
}) {
  if (page.pageCount < 2) return null;
  const current = page.query.page;
  const pages = Array.from({ length: page.pageCount }, (_, i) => i + 1).filter(
    (number) =>
      page.pageCount <= 7 ||
      number === 1 ||
      number === page.pageCount ||
      Math.abs(number - current) <= 1,
  );
  const controls: {
    key: string;
    label: ReactNode;
    target: number;
    current?: boolean;
    disabled?: boolean;
  }[] = [
    {
      key: "previous",
      label: "Previous",
      target: current - 1,
      disabled: current === 1,
    },
  ];
  for (const [index, number] of pages.entries()) {
    if (index > 0 && number - pages[index - 1] > 1)
      controls.push({
        key: `gap-${number}`,
        label: <span aria-hidden>…</span>,
        target: number,
        disabled: true,
      });
    controls.push({
      key: String(number),
      label: number,
      target: number,
      current: current === number,
    });
  }
  controls.push({
    key: "next",
    label: "Next",
    target: current + 1,
    disabled: current === page.pageCount,
  });
  return (
    <nav
      aria-label={`${kind === "notes" ? "Notes" : "Thoughts"} pages`}
      className={cn(
        "flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between",
        kind === "notes" ? "mt-7 border-t" : "mt-12",
      )}
      lang="en"
    >
      <p className="shrink-0 text-xs text-muted-foreground">
        {(current - 1) * DIRECTORY_PAGE_SIZE + 1}–
        {Math.min(current * DIRECTORY_PAGE_SIZE, page.total)} of {page.total}
      </p>
      <ul className="flex items-center justify-between gap-1 sm:justify-end">
        {controls.map((control) => {
          const className = cn(
            "inline-flex min-h-11 min-w-8 items-center justify-center rounded-md px-2 text-xs sm:min-h-9",
            control.current && "bg-foreground font-medium text-background",
            !control.current && "text-muted-foreground",
            !(disabled || control.disabled) &&
              !control.current &&
              "hover:bg-muted hover:text-foreground",
          );
          return (
            <li key={control.key}>
              {disabled || control.disabled ? (
                <span
                  className={cn(className, "opacity-50")}
                  aria-disabled="true"
                  aria-current={control.current ? "page" : undefined}
                >
                  {control.label}
                </span>
              ) : (
                <a
                  href={directoryHref(kind, {
                    ...page.query,
                    page: control.target,
                  })}
                  aria-label={
                    typeof control.label === "number"
                      ? `Page ${control.target}`
                      : undefined
                  }
                  aria-current={control.current ? "page" : undefined}
                  className={className}
                  onClick={
                    onPage
                      ? (event) => {
                          if (isPlainClick(event)) {
                            event.preventDefault();
                            if (!control.current) onPage(control.target);
                          }
                        }
                      : undefined
                  }
                >
                  {control.label}
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
