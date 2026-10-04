import { site } from "@/config/site";
import { cn } from "@/lib/utils";

export const TEXT_LINK =
  "underline decoration-border underline-offset-4 transition-colors hover:text-accent hover:decoration-accent";

// Experience drawn as a git graph: a rail with one commit dot per entry, newest at HEAD.
// Each entry reads like a commit: date and subject on one line, an optional body below.
export function ExperienceLog() {
  return (
    <ol aria-label="Experience">
      {site.log.map((entry, index) => (
        <li
          key={`${entry.date} ${entry.text}`}
          className="relative pb-6 pl-7 before:absolute before:top-5 before:bottom-0 before:left-[5px] before:w-px before:bg-border last:pb-0 last:before:hidden"
        >
          <span
            aria-hidden
            className={cn(
              "absolute top-[4.5px] left-0 size-[11px] rounded-full border-2 border-accent sm:top-[8.5px]",
              index === 0 ? "bg-accent" : "bg-background",
            )}
          />
          <div className="leading-7 sm:flex sm:items-baseline sm:gap-4">
            <time
              dateTime={entry.date.replace(".", "-")}
              className="block shrink-0 font-mono text-xs leading-5 text-muted-foreground sm:leading-7"
            >
              {entry.date}
            </time>
            <div>
              <p className="text-[15px] text-pretty text-foreground">
                <span className="mr-2 font-mono text-[13px] text-accent">
                  {entry.type}:
                </span>
                {"href" in entry ? (
                  <a
                    href={entry.href}
                    target="_blank"
                    rel="noreferrer"
                    className={TEXT_LINK}
                  >
                    {entry.text}
                  </a>
                ) : (
                  entry.text
                )}
                {index === 0 && (
                  <span className="ml-2 inline-block rounded bg-foreground px-1.5 align-[1px] font-mono text-[11px] leading-5 text-background">
                    HEAD
                  </span>
                )}
              </p>
              {"detail" in entry && (
                <p className="mt-0.5 text-[15px] leading-7 text-pretty text-foreground/70">
                  {entry.detail}
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
