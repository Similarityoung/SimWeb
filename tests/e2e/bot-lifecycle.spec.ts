import { expect, test, openEngine } from "./bot-runtime";

declare global {
  interface Window {
    __entryTrace: Promise<
      { elapsed: number; width: number; distances: number[] }[]
    >;
  }
}

test("waking uses the entrance gather without replaying the sleep ring or overwriting a particle", async ({
  page,
}) => {
  await openEngine(page);
  const results = await page.evaluate(() => {
    // A fully settled sleep and a sleep interrupted while still shrinking.
    return [0, 100, 3000].map((sleepDuration) =>
      window.__withBot(
        { state: sleepDuration ? "powering-down" : "spawning" },
        ({ bot, tick, advance }) => {
          const samples: { rings: number; lastParticleRadius: number }[] = [];
          advance(sleepDuration);
          const before = bot.group.getAttribute("transform");
          if (sleepDuration) bot.setState("spawning");
          tick();
          const after = bot.group.getAttribute("transform");
          for (let i = 0; i < 80; i++) {
            advance(10);
            samples.push({
              rings: bot.fx.rings.filter(
                (ring) =>
                  ring.style.display !== "none" &&
                  Number(ring.getAttribute("opacity")) > 0.001,
              ).length,
              lastParticleRadius: Number(bot.fx.parts[4].getAttribute("r")),
            });
          }
          return { sleepDuration, before, after, samples };
        },
      ),
    );
  });
  for (const result of results) {
    expect(result.after, `wake after ${result.sleepDuration}ms`).toBe(
      result.before,
    );
    expect(result.samples.every((sample) => sample.rings === 0)).toBe(true);
    // A gather dot is at most 9 SVG units; the sleep halo is around 30.
    expect(
      Math.max(...result.samples.map((sample) => sample.lastParticleRadius)),
    ).toBeLessThanOrEqual(9);
  }
});

test("first entrance gathers particles before growing from a dot", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.addEventListener(
      "bot-test:created",
      ({ detail: bot }) => {
        window.__entryTrace = window.__sampleFrames(3200, (elapsed) => ({
          elapsed,
          width:
            bot.body.getBoundingClientRect().width /
            bot.svg.getBoundingClientRect().width,
          distances: bot.fx.parts
            .slice(0, 5)
            .filter((part) => part.style.display !== "none")
            .map((part) =>
              Math.hypot(
                Number(part.getAttribute("cx")) - 114.2705,
                Number(part.getAttribute("cy")) - 114.2705,
              ),
            ),
        }));
      },
      { once: true },
    );
  });
  await page.goto("/");
  const particles = await (
    await page.waitForFunction(() => window.__entryTrace)
  ).jsonValue();
  const widths = particles.map((sample) => sample.width);
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
