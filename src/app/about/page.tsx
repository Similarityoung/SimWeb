import { Fragment } from "react";
import type { Metadata } from "next";
import { PageFrame, PageTitle } from "@/components/site/page-shell";
import { site } from "@/config/site";
import { monthlyActivity } from "@/lib/writing/activity";
import { getArticleSummaries } from "@/lib/writing/content.server";
import { ExperienceLog } from "./experience-log";
import { WritingCalendar } from "./writing-calendar";
import { WritingStats } from "./writing-stats";

const TITLE = "About Me";
const PROSE = "text-base leading-7 text-foreground/80 sm:leading-[30px]";

export const metadata: Metadata = { title: TITLE };

// Epigraph under the title: boxed and weighted so it reads as a motto, not body text.
function Slogan() {
  return (
    <p className="mt-5 flex w-fit items-center gap-3 border-l-[3px] border-accent bg-muted px-4 py-2 text-base font-medium tracking-[0.04em] text-foreground">
      {site.slogan.map((phrase, index) => (
        <Fragment key={phrase}>
          {index > 0 && (
            <span
              aria-hidden
              className="size-1 shrink-0 rounded-full bg-accent"
            />
          )}
          <span>
            {phrase}
            {index < site.slogan.length - 1 && (
              <span className="sr-only">,</span>
            )}
          </span>
        </Fragment>
      ))}
    </p>
  );
}

// Emphasize the opening sentence while keeping the shared copy intact.
function LeadParagraph({ text }: { text: string }) {
  const sentenceEnd = text.indexOf(". ");
  const lead = sentenceEnd === -1 ? text : text.slice(0, sentenceEnd + 1);
  return (
    <p>
      <strong className="font-medium text-foreground">{lead}</strong>
      {text.slice(lead.length)}
    </p>
  );
}

// One continuous essay with no section headings: who I am, what I did,
// how I think, what I write. The log and heatmap sit where the prose
// refers to them, so they read as part of the story rather than widgets.
export default function AboutPage() {
  const articles = getArticleSummaries();
  const activity = monthlyActivity(articles);
  return (
    <PageFrame>
      <header className="max-w-2xl">
        <PageTitle>{TITLE}</PageTitle>
        <Slogan />
      </header>

      <article className={`mt-8 max-w-3xl ${PROSE}`}>
        {site.about.map((paragraph) => (
          <LeadParagraph key={paragraph} text={paragraph} />
        ))}

        <div className="mt-8">
          <ExperienceLog />
        </div>

        <div className="mt-10 space-y-4">
          {site.thoughts.map((paragraph, index) =>
            index === 0 ? (
              <LeadParagraph key={paragraph} text={paragraph} />
            ) : (
              <p key={paragraph}>{paragraph}</p>
            ),
          )}
        </div>

        <p className="mt-10">{site.writing}</p>
        {/* Share a width on small screens; keep the desktop gap beside the actual heatmap. */}
        <div className="mt-6 grid min-w-0 max-w-[30rem] gap-6 md:max-w-none md:grid-cols-[minmax(0,30rem)_minmax(10rem,1fr)] md:items-start lg:gap-8">
          <div className="min-w-0">
            <WritingCalendar activity={activity} />
          </div>
          <WritingStats articles={articles} />
        </div>
      </article>
    </PageFrame>
  );
}
