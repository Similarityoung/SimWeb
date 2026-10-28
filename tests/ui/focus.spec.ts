import { expect, test } from "@playwright/test";

// VIS-05 baseline: Phase 1 migrates component-level focus styles. Until then
// this stays fixme so the suite reports the gap instead of a false pass.
test.fixme("focus ring uses the density-aware width and a visible outline", async ({
  page,
}) => {
  await page.goto("/");
  const ring = await page.evaluate(() => {
    const width = getComputedStyle(document.documentElement)
      .getPropertyValue("--focus-ring-width")
      .trim();
    const link = document.querySelector("a");
    if (!link) return { width, outline: "" };
    link.focus();
    return { width, outline: getComputedStyle(link).outlineStyle };
  });
  expect(ring.width).not.toBe("");
  expect(ring.outline).not.toBe("none");
});
