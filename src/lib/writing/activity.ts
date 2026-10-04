import type { ArticleSummary } from "./types";

type MonthKey = { year: number; month: number };

type ActivityYear = {
  year: number;
  // Index 0 is January; null marks months before the first or after the latest article.
  months: readonly (number | null)[];
};

export type MonthlyActivity = {
  total: number;
  first?: MonthKey;
  peak?: MonthKey & { count: number };
  years: readonly ActivityYear[];
};

const MONTH_PATTERN = /^(\d{4})-(\d{2})/;
// Upper bounds of shades 1–3; anything above is shade 4.
const LEVEL_BOUNDS = [1, 3, 6] as const;
// Smallest count drawn in the darkest shade, for the legend.
export const TOP_LEVEL_FROM = LEVEL_BOUNDS[LEVEL_BOUNDS.length - 1] + 1;

function parseMonth({ id, date }: Pick<ArticleSummary, "id" | "date">) {
  const match = MONTH_PATTERN.exec(date);
  const month = match ? Number(match[2]) : 0;
  if (!match || month < 1 || month > 12)
    throw new Error(`Article "${id}" has an invalid date: ${date}`);
  return { year: Number(match[1]), month };
}

const ordinal = ({ year, month }: MonthKey) => year * 12 + month - 1;

export function monthlyActivity(
  articles: readonly Pick<ArticleSummary, "id" | "date">[],
): MonthlyActivity {
  const counts = new Map<number, number>();
  for (const article of articles) {
    const key = ordinal(parseMonth(article));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (!counts.size) return { total: 0, years: [] };

  const keys = [...counts.keys()];
  const start = Math.min(...keys);
  const end = Math.max(...keys);
  const toMonth = (key: number) => ({
    year: Math.floor(key / 12),
    month: (key % 12) + 1,
  });
  const peakKey = keys.reduce((best, key) =>
    counts.get(key)! > counts.get(best)! ? key : best,
  );
  const years = Array.from(
    { length: toMonth(end).year - toMonth(start).year + 1 },
    (_, offset) => {
      const year = toMonth(start).year + offset;
      return {
        year,
        months: Array.from({ length: 12 }, (_, index) => {
          const key = year * 12 + index;
          return key < start || key > end ? null : (counts.get(key) ?? 0);
        }),
      };
    },
  );
  return {
    total: articles.length,
    first: toMonth(start),
    peak: { ...toMonth(peakKey), count: counts.get(peakKey)! },
    years,
  };
}

export function activityLevel(count: number) {
  if (count <= 0) return 0;
  const index = LEVEL_BOUNDS.findIndex((bound) => count <= bound);
  return index === -1 ? LEVEL_BOUNDS.length + 1 : index + 1;
}
