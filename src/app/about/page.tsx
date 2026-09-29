import { PageShell } from "@/components/site/page-shell";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "About Me" };

export default function AboutPage() {
  return (
    <PageShell
      title="About me"
      description={`Hi, I’m ${site.fullName}. You might know me as ${site.name}.`}
    >
      <div className="max-w-2xl space-y-6 text-base leading-8 text-foreground/80">
        {site.about.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t pt-6 text-sm">
        <a
          href={site.github}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 underline decoration-border underline-offset-4 hover:text-accent"
        >
          Find me on GitHub
          <ArrowUpRight className="size-4" aria-hidden />
        </a>
        <a
          href="https://community.apache.org/blog/2026_06_committers.html#dubbo"
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 underline decoration-border underline-offset-4 hover:text-accent"
        >
          Apache community announcement
          <ArrowUpRight className="size-4" aria-hidden />
        </a>
      </div>
    </PageShell>
  );
}
