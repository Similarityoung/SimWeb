"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { GitHubIcon } from "./github-icon";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="mx-auto flex h-[76px] w-full max-w-4xl shrink-0 items-center justify-between gap-3 px-[18px] sm:px-7">
      {pathname === "/" ? (
        <a
          href={site.github}
          aria-label="GitHub profile"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center gap-[7px] font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <GitHubIcon className="size-[17px]" />
          <span className="hidden sm:inline">GitHub</span>
          <ArrowUpRight className="hidden size-[13px] sm:block" aria-hidden />
        </a>
      ) : (
        <Link
          href="/"
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground sm:text-xs"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Home
        </Link>
      )}
      <nav
        aria-label="Main navigation"
        className="-mr-[7px] flex items-center sm:-mr-[9px] sm:gap-0.5"
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
    </header>
  );
}
