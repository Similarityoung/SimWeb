import { expect, test } from "@playwright/test";

test("article Mermaid fences render as SVG without disrupting code or narrow layouts", async ({
  page,
  isMobile,
}) => {
  await page.setViewportSize({ width: isMobile ? 320 : 1280, height: 800 });
  await page.goto("/notes/pixiu-route-snapshot-trie");

  await expect(page.locator("article svg.pele")).toHaveCount(2);
  await expect(
    page.locator("article pre code.language-go").first(),
  ).toBeVisible();

  const layout = await page.evaluate(() => {
    const root = document.documentElement;
    return {
      viewportWidth: root.clientWidth,
      documentWidth: root.scrollWidth,
      chartsContained: [...document.querySelectorAll("article svg.pele")].every(
        (svg) => {
          const rect = svg.parentElement!.getBoundingClientRect();
          return rect.left >= 0 && rect.right <= root.clientWidth;
        },
      ),
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
  expect(layout.chartsContained).toBe(true);
});
