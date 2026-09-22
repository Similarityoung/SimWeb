import { expect, test } from "@playwright/test";

for (const random of [0, 0.99]) {
  const responding = "writing";
  test(`writing lasts through the answer, then spin, hop and particles play once with random ${random}`, async ({
    page,
  }) => {
    await page.addInitScript((value) => {
      Math.random = () => value;
    }, random);
    await page.addInitScript(() => {
      Object.defineProperty(window, "GrokCharacter", {
        configurable: true,
        set(
          Character: new (...args: unknown[]) => {
            extras: { turn: number | null; hop: number };
          },
        ) {
          Object.defineProperty(window, "GrokCharacter", {
            configurable: true,
            writable: true,
            value: class extends Character {
              constructor(...args: unknown[]) {
                super(...args);
                Object.assign(window, { __bot: this });
              }
            },
          });
        },
      });
    });
    await page.goto("/");
    const bot = page.getByRole("img", { name: "Interactive character" });
    // Wait for arrival to finish, not the idle frame before initialization.
    await expect(bot.locator("svg")).toHaveAttribute("data-state", "spawning");
    await expect(bot.locator("svg")).toHaveAttribute("data-state", "idle");
    const result = await page.evaluate(
      () =>
        new Promise<{
          samples: {
            phase: string;
            state: string;
            cards: number;
            progressRing: boolean;
            ribbons: boolean;
            particles: number;
            turn: number;
            hop: number;
            at: number;
          }[];
          sameSvg: boolean;
        }>((resolve, reject) => {
          const svg = document.querySelector(
            '[aria-label="Interactive character"] svg',
          );
          const samples: {
            phase: string;
            state: string;
            cards: number;
            progressRing: boolean;
            ribbons: boolean;
            particles: number;
            turn: number;
            hop: number;
            at: number;
          }[] = [];
          const start = performance.now();
          const deadline = setTimeout(
            () => reject(new Error("Presentation did not settle")),
            13_000,
          );
          const sample = () => {
            const answer = document.querySelector('[data-testid="answer"]');
            const phase = answer?.getAttribute("data-phase") ?? "";
            const ring = svg?.querySelector("circle[stroke-dashoffset]");
            const extras = (
              window as unknown as {
                __bot: { extras: { turn: number | null; hop: number } };
              }
            ).__bot.extras;
            samples.push({
              particles: svg?.querySelectorAll("[data-particle]").length ?? 0,
              turn: Math.abs(extras.turn ?? 0),
              hop: extras.hop,
              phase,
              state: svg?.getAttribute("data-state") ?? "",
              cards: answer?.querySelectorAll("a").length ?? 0,
              progressRing: !!ring && getComputedStyle(ring).display !== "none",
              ribbons: [
                ...(svg?.querySelectorAll("path[data-trail]") ?? []),
              ].some(
                (path) =>
                  !!path.getAttribute("d") &&
                  Number(path.getAttribute("opacity")) > 0,
              ),
              at: performance.now() - start,
            });
            if (
              phase === "complete" &&
              samples.some((frame) => frame.state === "celebrate") &&
              svg?.getAttribute("data-state") === "idle"
            ) {
              clearTimeout(deadline);
              resolve({
                samples,
                sameSvg:
                  svg ===
                  document.querySelector(
                    '[aria-label="Interactive character"] svg',
                  ),
              });
            } else requestAnimationFrame(sample);
          };
          document
            .querySelector<HTMLButtonElement>(
              '[aria-label="Conversation topics"] > button:nth-child(2)',
            )!
            .click();
          requestAnimationFrame(sample);
        }),
    );
    const { samples } = result;
    expect(result.sameSvg).toBe(true);
    expect(
      samples.some(
        (frame) => frame.phase === "sending" && frame.state === responding,
      ),
    ).toBe(true);
    expect(
      samples.some(
        (frame) => frame.phase === "streaming" && frame.state === responding,
      ),
    ).toBe(true);
    for (const count of [1, 2]) {
      expect(
        samples.some(
          (frame) =>
            frame.phase === "cards" &&
            frame.cards === count &&
            frame.state === responding,
        ),
      ).toBe(true);
    }
    expect(
      samples.some(
        (frame) => frame.phase === "complete" && frame.state === "idle",
      ),
    ).toBe(true);
    expect([
      ...new Set(
        samples.map((frame) => frame.state).filter((state) => state !== "idle"),
      ),
    ]).toEqual([responding, "celebrate"]);
    const completion = samples.filter((frame) => frame.state === "celebrate");
    const rotating = completion.filter(
      (frame) => frame.turn > 0 && frame.turn < Math.PI * 2,
    );
    const hopping = completion.filter((frame) => frame.hop < 0);
    const particles = completion.filter((frame) => frame.particles > 0);
    expect(rotating.length).toBeGreaterThan(2);
    expect(
      rotating.every((frame) => frame.hop === 0 && frame.particles === 0),
    ).toBe(true);
    expect(hopping.length).toBeGreaterThan(2);
    expect(
      hopping.every(
        (frame) => frame.turn === Math.PI * 2 && frame.particles === 0,
      ),
    ).toBe(true);
    expect(particles.length).toBeGreaterThan(2);
    expect(particles[0].at).toBeGreaterThan(hopping.at(-1)!.at);
    expect(
      particles.every((frame) => frame.hop === 0 && frame.cards === 3),
    ).toBe(true);
    expect(Math.max(...particles.map((frame) => frame.particles))).toBe(14);
    expect(completion.at(-1)!.particles).toBe(0);
    expect(samples.every((frame) => !frame.ribbons)).toBe(true);
    expect(
      samples
        .filter((frame) => frame.phase !== "complete")
        .every((frame) => frame.particles === 0),
    ).toBe(true);
    const completionStartedAt = completion[0].at;
    const settledAt = samples.find(
      (frame) => frame.at > completionStartedAt && frame.state === "idle",
    )!.at;
    expect(settledAt - completionStartedAt).toBeGreaterThan(2_150);
    expect(settledAt - completionStartedAt).toBeLessThan(2_900);
    expect(samples.every((frame) => !frame.progressRing)).toBe(true);
    expect(
      samples
        .filter((frame) => frame.phase === "streaming")
        .every((frame) => frame.cards === 0),
    ).toBe(true);
    expect(
      samples.find((frame) => frame.phase === "complete")!.at,
    ).toBeGreaterThan(4_000);
    expect(
      samples.find((frame) => frame.phase === "complete")!.at,
    ).toBeLessThan(6_500);
    await expect(bot.locator("svg")).toHaveAttribute("data-state", "idle");
    await expect(page.getByTestId("answer").getByRole("link")).toHaveCount(3);
  });
}

test("focus cannot replace the active move; clearing card presentation cannot restart it", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Notes/ }).click();
  const svg = page.getByRole("img").locator("svg");
  await expect(svg).toHaveAttribute("data-state", "writing");
  const selected = await svg.getAttribute("data-state");
  await page.getByRole("textbox").fill("Another question");
  await expect(svg).toHaveAttribute("data-state", selected!);
  // Sample each frame: the first-card window lasts only 300ms.
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="answer"]')?.querySelectorAll("a")
        .length === 1,
  );
  await page.getByRole("button", { name: "Clear conversation" }).click();
  await expect(svg).toHaveAttribute("data-state", "idle");
  // Observe beyond the cancelled card deadlines.
  const states = await svg.evaluate(
    (element) =>
      new Promise<string[]>((resolve) => {
        const states: string[] = [];
        const observer = new MutationObserver(() =>
          states.push(element.getAttribute("data-state") ?? ""),
        );
        observer.observe(element, {
          attributes: true,
          attributeFilter: ["data-state"],
        });
        setTimeout(() => {
          observer.disconnect();
          resolve(states);
        }, 1_500);
      }),
  );
  expect(states.every((state) => state === "idle")).toBe(true);
  await expect(page.getByTestId("exchange")).toHaveCount(0);
});

test("reduced motion freezes the decorative SVG while text still unfolds", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect(page.getByTestId("streaming-text")).toContainText("I write");
  const result = await page.evaluate(
    () =>
      new Promise<{ svgs: string[]; lengths: number[] }>((resolve) => {
        const svg = document.querySelector(
          '[aria-label="Interactive character"] svg',
        )!;
        const svgs: string[] = [],
          lengths: number[] = [];
        const start = performance.now();
        const sample = () => {
          svgs.push(svg.innerHTML);
          lengths.push(
            document.querySelector('[data-testid="streaming-text"]')
              ?.textContent?.length ?? 0,
          );
          if (performance.now() - start < 500) requestAnimationFrame(sample);
          else resolve({ svgs, lengths });
        };
        requestAnimationFrame(sample);
      }),
  );
  expect(new Set(result.svgs).size).toBe(1);
  expect(new Set(result.lengths).size).toBeGreaterThan(1);
  await expect(page.getByTestId("answer")).toHaveAttribute(
    "data-state",
    "complete",
  );
  await expect(page.getByRole("img").locator("svg")).toHaveAttribute(
    "data-state",
    "celebrate",
  );
  await expect(page.locator("path[data-trail], [data-particle]")).toHaveCount(
    0,
  );
});

test("a new question and clear remove completion particles immediately", async ({
  page,
}) => {
  await page.goto("/");
  const svg = page.getByRole("img").locator("svg");
  await page.getByRole("button", { name: /^Projects/ }).click();
  await expect(svg).toHaveAttribute("data-state", "celebrate", {
    timeout: 8_000,
  });
  // A short burst can fall between expect.poll's backoff intervals.
  await page.waitForFunction(() => document.querySelector("[data-particle]"));
  await page.getByRole("button", { name: /^Notes/ }).click();
  await expect(svg).toHaveAttribute("data-state", "writing");
  await expect(svg.locator("[data-particle]")).toHaveCount(0);
  await expect(svg).toHaveAttribute("data-state", "celebrate", {
    timeout: 8_000,
  });
  // A short burst can fall between expect.poll's backoff intervals.
  await page.waitForFunction(() => document.querySelector("[data-particle]"));
  await page.getByRole("button", { name: "Clear conversation" }).click();
  await expect(svg).toHaveAttribute("data-state", "idle");
  await expect(svg.locator("[data-particle]")).toHaveCount(0);
});

test("the development action preview is unavailable in production", async ({
  page,
}) => {
  const response = await page.goto("/dev/bot");
  expect(response?.status()).toBe(404);
});
