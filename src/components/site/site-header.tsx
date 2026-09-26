"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GitHubIcon } from "./github-icon";
import { ThemeToggle } from "./theme-toggle";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="mx-auto flex h-[76px] w-full max-w-4xl shrink-0 items-center justify-between gap-1.5 px-[18px] sm:gap-3 sm:px-7">
      <nav
        aria-label="Main navigation"
        className="-ml-1 flex items-center min-[380px]:-ml-[7px] sm:-ml-[9px] sm:gap-0.5"
      >
        {site.navigation.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-md px-[3px] font-mono text-[10px] whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground min-[380px]:px-[7px] min-[380px]:text-[11px] sm:px-[9px] sm:text-xs",
                active ? "text-accent" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="h-11 w-8 text-muted-foreground hover:bg-muted hover:text-foreground sm:w-9 dark:hover:bg-muted"
        >
          <a
            href={site.github}
            aria-label="GitHub profile"
            title="GitHub profile"
            target="_blank"
            rel="noreferrer"
          >
            <GitHubIcon className="size-[17px]" />
          </a>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
