"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
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
          <a
            href={site.github}
            aria-label="GitHub profile"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 min-w-8 shrink-0 items-center gap-[7px] font-mono text-xs text-muted-foreground transition-colors hover:text-foreground sm:min-w-11"
          >
            <GitHubIcon className="size-[17px]" />
            <span className="hidden sm:inline">GitHub</span>
            <ArrowUpRight className="hidden size-[13px] sm:block" aria-hidden />
          </a>
        ) : (
          <Link
            href="/"
            aria-label="Home"
            className="inline-flex min-h-11 min-w-8 shrink-0 items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground sm:min-w-11 sm:text-xs"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            <span className="hidden min-[360px]:inline">Home</span>
          </Link>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
