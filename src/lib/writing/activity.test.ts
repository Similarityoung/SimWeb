import assert from "node:assert/strict";
import { test } from "node:test";
import { activityLevel, monthlyActivity, TOP_LEVEL_FROM } from "./activity";

test("groups articles by month from the first to the latest article", () => {
  const activity = monthlyActivity([
    { id: "a", date: "2024-11-03T22:17:44+08:00" },
    { id: "b", date: "2024-11-20" },
    { id: "c", date: "2025-02-01" },
  ]);
  assert.equal(activity.total, 3);
  assert.deepEqual(activity.first, { year: 2024, month: 11 });
  assert.deepEqual(activity.peak, { year: 2024, month: 11, count: 2 });
  assert.deepEqual(
    activity.years.map(({ year }) => year),
    [2024, 2025],
  );
  const [y2024, y2025] = activity.years;
  // Months outside the written range are null, empty months inside are 0.
  assert.deepEqual(y2024.months.slice(9), [null, 2, 0]);
  assert.deepEqual(y2025.months.slice(0, 3), [0, 1, null]);
});

test("rejects dates it cannot place on the calendar", () => {
  assert.throws(
    () => monthlyActivity([{ id: "bad", date: "June 2024" }]),
    /bad/,
  );
});

test("returns an empty calendar without articles", () => {
  const activity = monthlyActivity([]);
  assert.equal(activity.total, 0);
  assert.deepEqual(activity.years, []);
});

test("maps counts to a few fixed shades", () => {
  assert.deepEqual(
    [0, 1, 2, 3, 4, 6, 7, 10].map(activityLevel),
    [0, 1, 2, 2, 3, 3, 4, 4],
  );
});

test("legend threshold is where the darkest shade begins", () => {
  assert.equal(activityLevel(TOP_LEVEL_FROM), 4);
  assert.equal(activityLevel(TOP_LEVEL_FROM - 1), 3);
});
