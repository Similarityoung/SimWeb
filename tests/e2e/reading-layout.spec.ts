import { expect, test } from "@playwright/test";
import { readPublishedArticles } from "../../src/lib/writing/catalog";

const articles = readPublishedArticles("content").map(({ article }) => article);

test("published articles fit the viewport while wide code blocks scroll locally", async ({
  page,
  isMobile,
}) => {
  test.setTimeout(60_000);
  await page.setViewportSize({ width: isMobile ? 320 : 1280, height: 800 });
  let hasScrollableCode = false;
  for (const article of articles) {
    await test.step(article.title, async () => {
      await page.goto(article.href);
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => {
        const root = document.documentElement;
        const blocks = [...document.querySelectorAll("article pre")];
        return {
          width: root.clientWidth,
          scrollWidth: root.scrollWidth,
          scrollableCode: blocks.some(
            (block) => block.scrollWidth > block.clientWidth,
          ),
          containedCode: blocks.every((block) => {
            const rect = block.getBoundingClientRect();
            return rect.left >= 0 && rect.right <= root.clientWidth;
          }),
        };
      });
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
      expect(layout.containedCode).toBe(true);
      hasScrollableCode ||= layout.scrollableCode;
    });
  }
  expect(hasScrollableCode).toBe(true);
});

test("code token colors remain distinct and readable in both themes", async ({
  page,
}) => {
  function luminance(rgb: string) {
    const channels = rgb
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map(Number)
      .map((value) => {
        const channel = value / 255;
        return channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4;
      });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/notes/go-language-learning-notes");
    await expect(page.locator("html")).toHaveClass(new RegExp(theme));
    const palette = await page.evaluate(() => {
      const article = document.querySelector("article")!;
      const colors = [
        ...new Set(
          [...article.querySelectorAll('[class*="hljs-"]')].map(
            (token) => getComputedStyle(token).color,
          ),
        ),
      ];
      return {
        colors,
        foreground: getComputedStyle(article).color,
        // Code blocks use this surface at 60% opacity over the page background.
        surface: getComputedStyle(article).getPropertyValue("--muted").trim(),
      };
    });
    expect(
      palette.colors.filter((color) => color !== palette.foreground).length,
    ).toBeGreaterThanOrEqual(3);
    const hex = palette.surface.slice(1);
    const surface = luminance(
      `rgb(${[0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`,
    );
    for (const color of palette.colors) {
      const value = luminance(color);
      expect(
        (Math.max(value, surface) + 0.05) / (Math.min(value, surface) + 0.05),
        color,
      ).toBeGreaterThanOrEqual(4.5);
    }
  }
});
