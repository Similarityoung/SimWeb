import { expect, test } from "@playwright/test";

for (const path of ["/", "/notes", "/projects", "/about"]) {
  test(`${path} has no page-level horizontal scroll at 320px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const width = await page.evaluate(() => ({
      client: document.documentElement.clientWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(width.scroll).toBeLessThanOrEqual(width.client + 1);
  });
}

test("article code blocks stay inside the viewport at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/notes/go-language-learning-notes");
  await page.evaluate(() => document.fonts.ready);
  const layout = await page.evaluate(() => {
    const root = document.documentElement;
    const blocks = [...document.querySelectorAll("article pre")];
    return {
      client: root.clientWidth,
      scroll: root.scrollWidth,
      contained: blocks.every((block) => {
        const rect = block.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= root.clientWidth;
      }),
      scrollable: blocks.some((block) => block.scrollWidth > block.clientWidth),
    };
  });
  expect(layout.scroll).toBeLessThanOrEqual(layout.client + 1);
  expect(layout.contained).toBe(true);
  expect(layout.scrollable).toBe(true);
});
