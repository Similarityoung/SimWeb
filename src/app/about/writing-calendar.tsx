import {
  activityLevel,
  TOP_LEVEL_FROM,
  type MonthlyActivity,
} from "@/lib/writing/activity";
import { cn } from "@/lib/utils";

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
// Shades follow the accent token. Dark mode uses a steeper ramp because low
// alphas of the accent blur into the dark background.
const SHADES = [
  "bg-muted",
  "bg-accent/20 dark:bg-accent/30",
  "bg-accent/40 dark:bg-accent/50",
  "bg-accent/65 dark:bg-accent/75",
  "bg-accent",
] as const;
// Cells stretch to the column but stay square, so the grid reads as a heatmap.
const CELL = "aspect-square rounded-[3px]";
const LABEL = "font-mono text-xs text-muted-foreground";

const pad = (month: number) => String(month).padStart(2, "0");

// Tooltips near the edges anchor inward so they never widen the page.
function tooltipAnchor(month: number) {
  if (month <= 3) return "left-0";
  if (month >= 10) return "right-0";
  return "left-1/2 -translate-x-1/2";
}

function Cell({
  year,
  month,
  count,
}: {
  year: number;
  month: number;
  count: number | null;
}) {
  if (count === null)
    return <span className={cn(CELL, "border border-border/50")} />;
  return (
    <span
      className={cn(
        CELL,
        "group relative transition-shadow hover:ring-1 hover:ring-foreground/40",
        SHADES[activityLevel(count)],
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute bottom-full z-10 mb-1.5 rounded-md bg-foreground px-2 py-1 text-[11px] leading-4 whitespace-nowrap text-background opacity-0 transition-opacity group-hover:opacity-100",
          tooltipAnchor(month),
        )}
      >
        {year}.{pad(month)} · {count} {count === 1 ? "post" : "posts"}
      </span>
    </span>
  );
}

// The scale speaks for itself: numbers at both ends, no caption.
function Legend() {
  return (
    <div
      aria-hidden
      className={cn(
        LABEL,
        "col-span-full mt-2 flex items-center justify-end gap-1",
      )}
    >
      <span className="mr-1">0</span>
      {SHADES.map((shade) => (
        <span key={shade} className={cn(CELL, "w-3.5", shade)} />
      ))}
      <span className="ml-1">{TOP_LEVEL_FROM}+</span>
    </div>
  );
}

export function WritingCalendar({ activity }: { activity: MonthlyActivity }) {
  const { first, peak, total, years } = activity;
  if (!first || !peak) return null;
  return (
    <div
      role="img"
      aria-label={`Posts per month: ${total} since ${first.year}.${pad(first.month)}, peaking at ${peak.count} in ${peak.year}.${pad(peak.month)}.`}
      className="grid grid-cols-[2.75rem_repeat(12,minmax(0,1fr))] items-center gap-1"
    >
      <span />
      {MONTHS.map((month) => (
        <span key={month} aria-hidden className={cn(LABEL, "text-center")}>
          {month}
        </span>
      ))}
      {years.map(({ year, months }) => (
        <div key={year} aria-hidden className="contents">
          <span className={LABEL}>{year}</span>
          {months.map((count, index) => (
            <Cell key={index} year={year} month={index + 1} count={count} />
          ))}
        </div>
      ))}
      <Legend />
    </div>
  );
}
