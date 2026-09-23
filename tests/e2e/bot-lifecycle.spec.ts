import { expect, test } from "@playwright/test";

test("first entrance grows from a standby dot without shrinking first", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "GrokCharacter", {
      configurable: true,
      set(
        Character: new (...args: unknown[]) => {
          svg: SVGSVGElement;
          body: SVGPathElement;
        },
      ) {
        Object.defineProperty(window, "GrokCharacter", {
          configurable: true,
          writable: true,
          value: class extends Character {
            constructor(...args: unknown[]) {
              super(...args);
              const widths: number[] = [];
              const start = performance.now();
              const sample = () => {
                widths.push(
                  this.body.getBoundingClientRect().width /
                    this.svg.getBoundingClientRect().width,
                );
                if (performance.now() - start < 2200)
                  requestAnimationFrame(sample);
                else Object.assign(window, { __entryWidths: widths });
              };
              requestAnimationFrame(sample);
            }
          },
        });
      },
    });
  });
  await page.goto("/");
  await page.waitForFunction(() => "__entryWidths" in window);
  const widths = await page.evaluate(
    () => (window as unknown as { __entryWidths: number[] }).__entryWidths,
  );
  expect(widths.length).toBeGreaterThan(20);
  expect(widths[0]).toBeLessThan(0.3);
  expect(widths.at(-1)).toBeGreaterThan(0.65);
  const largestDrop = Math.max(
    ...widths.map((width, i) => (i ? widths[i - 1] - width : 0)),
  );
  expect(largestDrop).toBeLessThan(0.02);
});
