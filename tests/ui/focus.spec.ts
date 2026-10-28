import { expect, test } from "@playwright/test";

for (const density of [1, 2] as const) {
  test(`focus ring uses ${density === 1 ? "2px" : "1.5px"} at ${density}x`, async ({
    browser,
  }) => {
    const context = await browser.newContext({
      baseURL: "http://127.0.0.1:3100",
      deviceScaleFactor: density,
    });
    const page = await context.newPage();

    try {
      await page.goto("/");
      const ringWidth = density === 1 ? "2px" : "1.5px";
      expect(
        await page.evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--focus-ring-width")
            .trim(),
        ),
      ).toBe(ringWidth);

      const textbox = page.getByRole("textbox", { name: "Ask a question" });
      const form = page.locator("form");
      const beforeFocus = await form.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          border: style.borderTopColor,
          shadow: style.boxShadow,
          transition: style.transitionProperty,
        };
      });
      await textbox.focus();
      await page.waitForTimeout(250);
      const formFocus = await form.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          border: style.borderTopColor,
          shadow: style.boxShadow,
          width: style.borderTopWidth,
          transition: style.transitionProperty,
        };
      });
      expect(formFocus.border).not.toBe(beforeFocus.border);
      expect(formFocus.shadow).toContain("inset");
      expect(formFocus.width).toBe("1px");
      expect(formFocus.transition).toContain("border-color");
      expect(formFocus.transition).toContain("box-shadow");

      expect(
        await textbox.evaluate(
          (element) => getComputedStyle(element).boxShadow,
        ),
      ).not.toContain(ringWidth);

      await textbox.fill("Hello");
      await page.keyboard.press("Tab");
      await page.waitForTimeout(250);
      const buttonRing = await page.evaluate(() => {
        const element = document.activeElement;
        if (!(element instanceof HTMLElement)) return null;
        return {
          label: element.getAttribute("aria-label"),
          shadow: getComputedStyle(element).boxShadow,
        };
      });
      expect(buttonRing?.label).toBe("Send question");
      expect(buttonRing?.shadow).toContain(ringWidth);
    } finally {
      await context.close();
    }
  });
}
