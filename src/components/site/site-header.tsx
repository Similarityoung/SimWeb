"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House } from "lucide-react";
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
        className="-ml-1 flex items-center min-[360px]:-ml-[7px] sm:-ml-[9px] sm:gap-0.5"
      >
        {site.navigation.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-md px-1 font-mono text-[11px] whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground min-[360px]:px-[7px] sm:px-[9px] sm:text-xs",
                active ? "text-accent" : "text-muted-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
        {pathname === "/" ? (
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
        ) : (
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-11 w-8 text-muted-foreground hover:bg-muted hover:text-foreground sm:w-9 dark:hover:bg-muted"
          >
            <Link href="/" aria-label="Home" title="Home">
              <House className="size-4" strokeWidth={1.5} aria-hidden />
            </Link>
          </Button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
