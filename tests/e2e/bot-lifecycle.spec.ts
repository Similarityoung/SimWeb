import { expect, test } from "@playwright/test";

test("first entrance gathers particles before growing from a dot", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "GrokCharacter", {
      configurable: true,
      set(
        Character: new (...args: unknown[]) => {
          svg: SVGSVGElement;
          body: SVGPathElement;
          fx: { parts: SVGCircleElement[] };
        },
      ) {
        Object.defineProperty(window, "GrokCharacter", {
          configurable: true,
          writable: true,
          value: class extends Character {
            constructor(...args: unknown[]) {
              super(...args);
              const widths: number[] = [];
              const particles: { elapsed: number; distances: number[] }[] = [];
              const start = performance.now();
              const sample = () => {
                const elapsed = performance.now() - start;
                widths.push(
                  this.body.getBoundingClientRect().width /
                    this.svg.getBoundingClientRect().width,
                );
                particles.push({
                  elapsed,
                  distances: this.fx.parts
                    .slice(0, 5)
                    .filter((part) => part.style.display !== "none")
                    .map((part) =>
                      Math.hypot(
                        Number(part.getAttribute("cx")) - 114.2705,
                        Number(part.getAttribute("cy")) - 114.2705,
                      ),
                    ),
                });
                if (elapsed < 3200) requestAnimationFrame(sample);
                else
                  Object.assign(window, {
                    __entryTrace: { widths, particles },
                  });
              };
              requestAnimationFrame(sample);
            }
          },
        });
      },
    });
  });
  await page.goto("/");
  await page.waitForFunction(() => "__entryTrace" in window);
  const { widths, particles } = await page.evaluate(
    () =>
      (
        window as unknown as {
          __entryTrace: {
            widths: number[];
            particles: { elapsed: number; distances: number[] }[];
          };
        }
      ).__entryTrace,
  );
  expect(widths.length).toBeGreaterThan(20);
  expect(widths[0]).toBeLessThan(0.3);
  expect(widths.at(-1)).toBeGreaterThan(0.65);
  expect(particles.some((sample) => sample.distances.length >= 3)).toBe(true);
  const first = particles.find((sample) => sample.distances.length > 0);
  expect(first?.distances[0]).toBeGreaterThan(30);
  const late = particles.find(
    (sample) => sample.elapsed > 800 && sample.distances.length > 0,
  );
  expect(late?.distances[0]).toBeLessThan(20);
  const largestDrop = Math.max(
    ...widths.map((width, i) => (i ? widths[i - 1] - width : 0)),
  );
  expect(largestDrop).toBeLessThan(0.02);
});
